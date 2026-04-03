const fs = require('fs');

global.antiSpamActive = global.antiSpamActive || false;
global.spamTracker = {}; // Registro temporaneo messaggi

module.exports = {
    name: 'antispam',
    prefix: '!',
    async execute(sock, m, args) {
        const remoteJid = m.key.remoteJid;
        const cmd = args[0]?.toLowerCase();

        if (cmd === 'on') {
            global.antiSpamActive = true;
            return await sock.sendMessage(remoteJid, { text: '🟡⚫ *『ＡＮＴＩ－ＳＰＡＭ』 ATTIVATO* 🏎️💨\n_Non correre troppo o verrai frenato._' });
        }
        if (cmd === 'off') {
            global.antiSpamActive = false;
            return await sock.sendMessage(remoteJid, { text: '⚪ *ANTISPAM DISATTIVATO*' });
        }
    }
};

// --- LOGICA MONITORAGGIO (Da inserire nel listener upsert) ---
async function monitorSpam(sock, m) {
    if (!global.antiSpamActive) return;

    const remoteJid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    
    // Controlliamo se è un Media (Sticker o Immagine)
    const isMediaSpam = m.message?.stickerMessage || m.message?.imageMessage;

    if (isMediaSpam) {
        const now = Date.now();
        if (!global.spamTracker[sender]) global.spamTracker[sender] = [];
        
        // Puliamo i messaggi vecchi più di 5 secondi
        global.spamTracker[sender] = global.spamTracker[sender].filter(time => now - time < 5000);
        
        // Aggiungiamo il timestamp attuale
        global.spamTracker[sender].push(now);

        if (global.spamTracker[sender].length >= 10) {
            // Check Admin (Immuni)
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
            if (isAdmin) return;

            // --- PUNIZIONE: MUTE ---
            // In Baileys, il "Mute" si fa chiudendo il gruppo a tutti o rimuovendo l'utente.
            // Qui simuliamo il Mute avvisando che i suoi messaggi verranno ignorati/cancellati per un po'.
            
            await sock.sendMessage(remoteJid, {
                image: { url: 'https://i.ibb.co/L6x8pYv/racing-speed.jpg' }, // Immagine tachimetro/corsa
                caption: `
🏎️💨 『ＡＮＴＩ－ＳＰＡＭ』 🏎️💨

⚠️ *FRENA @${sender.split('@')[0]}!* ⚠️
Hai inviato 10 media in meno di 5 secondi.

🚫 *STATO:* **MUTATO** (Temporaneo)
📉 *MOTIVO:* Flood di Sticker/Immagini.
_Rispetta i limiti della pista!_ 🟡⚫
`,
                mentions: [sender]
            });

            // Eliminiamo gli ultimi messaggi di spam se possibile
            await sock.sendMessage(remoteJid, { delete: m.key });

            // Reset del tracker per l'utente
            global.spamTracker[sender] = [];
        }
    }
}
