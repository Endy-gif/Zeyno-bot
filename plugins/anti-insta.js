const fs = require('fs');

// Database temporaneo per i Warn (puoi collegarlo al tuo db.json)
global.warns = global.warns || {}; 
global.antiInstaActive = global.antiInstaActive || false;

module.exports = {
    name: 'antiinsta',
    prefix: '!',
    async execute(sock, m, args) {
        const remoteJid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        
        // --- COMANDO DI ATTIVAZIONE ---
        const action = args[0]?.toLowerCase();
        if (action === 'on') {
            global.antiInstaActive = true;
            return await sock.sendMessage(remoteJid, { text: '💜 *αитι-ιиѕтαgяαм ATTIVATO* 💙\n_I trasgressori riceveranno 4 warn prima del kick._' });
        }
        if (action === 'off') {
            global.antiInstaActive = false;
            return await sock.sendMessage(remoteJid, { text: '🤍 *αитι-ιиѕтαgяαм DISATTIVATO*' });
        }
    }
};

// --- FUNZIONE DA INSERIRE NEL TUO LISTENER PRINCIPALE (upsert) ---
async function monitorInstagramLinks(sock, m) {
    if (!global.antiInstaActive) return;

    const remoteJid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";

    // 1. Controlla se il messaggio contiene link Instagram
    const isInstaLink = /(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+/gi.test(text);

    if (isInstaLink) {
        // 2. Controllo se l'utente è un Admin
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        if (admins.includes(sender)) return; // Gli admin sono immuni

        // 3. Elimina il messaggio
        await sock.sendMessage(remoteJid, { delete: m.key });

        // 4. Gestione Warn
        global.warns[sender] = (global.warns[sender] || 0) + 1;
        const currentWarns = global.warns[sender];

        if (currentWarns >= 4) {
            // ESPULSIONE
            await sock.groupParticipantsUpdate(remoteJid, [sender], "remove");
            await sock.sendMessage(remoteJid, { text: `💙 *𝚄𝚃𝙴𝙽𝚃𝙴 𝚁𝙸𝙼𝙾𝚂𝚂𝙾* 💜\n@${sender.split('@')[0]} ha raggiunto 4/4 warn per spam Instagram.`, mentions: [sender] });
            
            // Log privato a te
            await sock.sendMessage("IL_TUO_NUMERO@s.whatsapp.net", { text: `🚨 *ANTI-INSTA LOG*\nEspulso: wa.me/${sender.split('@')[0]}\nMotivo: Spam ripetuto.` });
            delete global.warns[sender];
        } else {
            // AVVERTIMENTO PUBBLICO
            const warnMsg = `
💜 💙 💜 💙 💜 💙 💜 💙
  *αитι-ιиѕтαgяαм*
💜 💙 💜 💙 💜 💙 💜 💙

⚠️ *ATTENZIONE* @${sender.split('@')[0]}
Lo spam di link Instagram non è permesso!

🚫 *Messaggio eliminato*
📉 *Warn:* [ ${currentWarns} / 4 ]
_Al prossimo scatterà un altro provvedimento._
----------------------------------`;

            await sock.sendMessage(remoteJid, { text: warnMsg, mentions: [sender] });
        }
    }
}
