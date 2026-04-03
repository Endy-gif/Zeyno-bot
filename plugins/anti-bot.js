const fs = require('fs');

// Database per gestire i timer e i codici (fondamentale per H24)
const dbPath = './antibot_db.json';
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ active: false, users: {} }));
let db = JSON.parse(fs.readFileSync(dbPath));

const saveDb = () => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

module.exports = {
    name: 'antibot',
    prefix: '.',
    async execute(sock, m, args) {
        const remoteJid = m.key.remoteJid;
        const mode = args[0]?.toLowerCase();

        if (mode === 'on') {
            db.active = true;
            saveDb();
            return await sock.sendMessage(remoteJid, { text: '🔴 *SISTEMA ANTI-BOT CYBER ATTIVATO* ⚫\n_Verifica obbligatoria per i nuovi ingressi._' });
        }
        if (mode === 'off') {
            db.active = false;
            saveDb();
            return await sock.sendMessage(remoteJid, { text: '⚪ *SISTEMA ANTI-BOT DISATTIVATO*' });
        }
    }
};

// --- LOGICA EVENTO ENTRATA (Da integrare nel listener group-participants.update) ---
async function onGroupJoin(sock, participant, groupId) {
    if (!db.active) return;

    // Genera codice random di 5 caratteri (es: X8J2P)
    const vCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    // Salva nel DB con scadenza H24
    db.users[participant] = {
        code: vCode,
        expires: Date.now() + (24 * 60 * 60 * 1000),
        groupId: groupId
    };
    saveDb();

    // INVIO IMMAGINE CYBER CON CODICE
    await sock.sendMessage(groupId, {
        image: { url: 'https://i.ibb.co/cy0v4V1/cyber-security.jpg' }, // Immagine Cyber/Matrix
        caption: `

  *𝖙𝖊𝖘𝖙 𝖉𝖎 𝖘𝖎𝖈𝖚𝖗𝖊𝖟𝖟𝖆*


⚠️ *ATTENZIONE* @${participant.split('@')[0]}
Dimostra di non essere un bot. Invia il codice qui sotto:

👉 *${vCode}* 👈

⏳ Hai *24 ORE* per rispondere.
🚫 *PENA:* Ban immediato dal gruppo.
----------------------------------`,
        mentions: [participant]
    });

    // Timer automatico per il BAN dopo 24 ore
    setTimeout(async () => {
        if (db.users[participant]) {
            await sock.groupParticipantsUpdate(groupId, [participant], "remove");
            await sock.updateBlockStatus(participant, "block"); // Blocco totale
            
            // Log a te
            await sock.sendMessage("IL_TUO_NUMERO@s.whatsapp.net", { 
                text: `🚨 *ANTIBOT LOG*\nUtente rimosso: wa.me/${participant.split('@')[0]}\nMotivo: Scadenza H24.` 
            });
            
            delete db.users[participant];
            saveDb();
        }
    }, 86400000);
}

// --- LOGICA VERIFICA (Da mettere nel listener dei messaggi) ---
async function checkVerification(sock, m) {
    const sender = m.key.participant || m.key.remoteJid;
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";

    if (db.users[sender]) {
        if (text.toUpperCase() === db.users[sender].code) {
            await sock.sendMessage(m.key.remoteJid, { text: '✅ *ACCESSO AUTORIZZATO*\nBenvenuto nel sistema.' }, { quoted: m });
            delete db.users[sender];
            saveDb();
        } else {
            // Se sbaglia il codice non lo banna subito (magari ha sbagliato a scrivere)
            // ma l'utente rimane nel database finché non scrive quello giusto o scade il tempo.
        }
    }
}
