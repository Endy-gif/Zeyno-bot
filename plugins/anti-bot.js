const fs = require('fs');
const { jidDecode } = require('@whiskeysockets/baileys');

// Caricamento/Creazione Database
const dbPath = './antibot_db.json';
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ active: false, users: {} }));
let db = JSON.parse(fs.readFileSync(dbPath));

function saveDb() {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

module.exports = {
    name: 'antibot',
    prefix: '.',
    async execute(sock, m, args) {
        const remoteJid = m.key.remoteJid;
        const text = args[0]?.toLowerCase();

        // Comando per Attivare/Disattivare
        if (text === 'on') {
            db.active = true;
            saveDb();
            return await sock.sendMessage(remoteJid, { text: '🔴 *SISTEMA ANTI-BOT ATTIVATO* ⚫\n_Modalità: Codice Random - 3 Tentativi - H24_' });
        }
        if (text === 'off') {
            db.active = false;
            saveDb();
            return await sock.sendMessage(remoteJid, { text: '⚪ *SISTEMA ANTI-BOT DISATTIVATO*' });
        }

        // --- LOGICA EVENTO ENTRATA (Da mettere nel listener group-participants.update) ---
        // Funzione per generare codice random di 5 caratteri
        const generateCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

        // ESEMPIO DI COSA SUCCEDE QUANDO ENTRA UN UTENTE:
        /*
        const newUser = "39333xxxxxx@s.whatsapp.net";
        const code = generateCode();
        db.users[newUser] = {
            code: code,
            attempts: 3,
            expires: Date.now() + (24 * 60 * 60 * 1000), // H24
            groupId: remoteJid
        };
        saveDb();

        const msgVerifica = `
🔴 ⚫ 🔴 ⚫ 🔴 ⚫ 🔴 ⚫
  *𝖙𝖊𝖘𝖙 𝖉𝖎 𝖘𝖎𝖈𝖚𝖗𝖊𝖟𝖟𝖆*
🔴 ⚫ 🔴 ⚫ 🔴 ⚫ 🔴 ⚫

⚠️ *ATTENZIONE* @${newUser.split('@')[0]}
Copia e invia questo codice per verificare il tuo account:

👉 *${code}* 👈

🚫 *Tentativi rimasti:* 3
⏳ *Scadenza:* 24 Ore
----------------------------------`;

        await sock.sendMessage(remoteJid, { text: msgVerifica, mentions: [newUser] });
        */
    }
};

// --- LOGICA DI CONTROLLO MESSAGGIO (Da mettere nel listener upsert) ---
async function handleMessage(sock, m) {
    if (!db.active) return;
    const userId = m.key.participant || m.key.remoteJid;
    const userMsg = m.message?.conversation || m.message?.extendedTextMessage?.text;

    if (db.users[userId]) {
        const data = db.users[userId];

        if (userMsg === data.code) {
            await sock.sendMessage(m.key.remoteJid, { text: '✅ *VERIFICA SUPERATA*\nBenvenuto nel gruppo!' }, { quoted: m });
            delete db.users[userId];
            saveDb();
        } else {
            data.attempts -= 1;
            if (data.attempts <= 0) {
                // BAN E BLOCCO
                await sock.groupParticipantsUpdate(data.groupId, [userId], "remove");
                await sock.updateBlockStatus(userId, "block");
                
                // Notifica a te
                await sock.sendMessage("IL_TUO_NUMERO@s.whatsapp.net", { 
                    text: `🚨 *ANTIBOT LOG*\nUtente: wa.me/${userId.split('@')[0]}\nStato: *BANNATO E BLOCCATO* (Tentativi esauriti).` 
                });

                delete db.users[userId];
            } else {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *CODICE ERRATO*\nTi rimangono *${data.attempts}* tentativi!` 
                }, { quoted: m });
            }
            saveDb();
        }
    }
}
