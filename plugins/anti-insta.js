 const fs = require('fs');

// Database per i Warn (puoi usare un file JSON per renderlo persistente come l'Anti-Bot)
global.antiInstaActive = global.antiInstaActive || false;
global.instaWarns = global.instaWarns || {};

module.exports = {
    name: 'antiinsta',
    prefix: '!',
    async execute(sock, m, args) {
        const remoteJid = m.key.remoteJid;
        const mode = args[0]?.toLowerCase();

        if (mode === 'on') {
            global.antiInstaActive = true;
            return await sock.sendMessage(remoteJid, { text: '💜 *αитι-ιиѕтαgяαм ATTIVATO* 💙\n_Slogan: No Spam, Just Vibes._' });
        }
        if (mode === 'off') {
            global.antiInstaActive = false;
            return await sock.sendMessage(remoteJid, { text: '🤍 *αитι-ιиѕтαgяαм DISATTIVATO*' });
        }
    }
};

// --- LOGICA DI MONITORAGGIO (Da inserire nel tuo listener upsert) ---
async function monitorInstagram(sock, m) {
    if (!global.antiInstaActive) return;

    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    // Regex per beccare link instagram.com o instagr.am
    const isInsta = /(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+/gi.test(text);

    if (isInsta) {
        const remoteJid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        // 1. Controllo Admin (Immuni)
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
        if (isAdmin) return;

        // 2. Elimina il messaggio all'istante
        await sock.sendMessage(remoteJid, { delete: m.key });

        // 3. Gestione Warn (4 totali)
        global.instaWarns[sender] = (global.instaWarns[sender] || 0) + 1;
        const current = global.instaWarns[sender];

        if (current >= 4) {
            // KICK E LOG
            await sock.groupParticipantsUpdate(remoteJid, [sender], "remove");
            await sock.sendMessage(remoteJid, { text: `💙 *SYSTEM PURGE* 💜\n@${sender.split('@')[0]} rimosso: Limite spam Instagram raggiunto.`, mentions: [sender] });
            
            // Notifica a te
            await sock.sendMessage("IL_TUO_NUMERO@s.whatsapp.net", { text: `🚨 *ANTI-IG LOG*\nUtente cacciato: wa.me/${sender.split('@')[0]}` });
            delete global.instaWarns[sender];
        } else {
            // 4. INVIO GIF/IMMAGINE NEON GLITCH
            await sock.sendMessage(remoteJid, {
                video: { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueGZ3bmZ4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpxV9P8HhC3C/giphy.mp4' }, // Esempio GIF Glitch
                gifPlayback: true,
                caption: `

  *αитι-ιиѕтαgяαм*


⚠️ *ECCEZIONE RILEVATA* @${sender.split('@')[0]}
I link Instagram non sono graditi in questa zona.

📉 *Warn:* [ ${current} / 4 ]
_Il sistema eliminerà ogni tentativo di spam._
----------------------------------`,
                mentions: [sender]
            });
        }
    }
}
