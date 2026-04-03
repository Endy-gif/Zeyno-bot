const fs = require('fs');

global.antiPornoActive = global.antiPornoActive || false;
global.pornoWarns = global.pornoWarns || {};

module.exports = {
    name: 'antiporno',
    prefix: '!',
    async execute(sock, m, args) {
        const remoteJid = m.key.remoteJid;
        const cmd = args[0]?.toLowerCase();

        if (cmd === 'on') {
            global.antiPornoActive = true;
            return await sock.sendMessage(remoteJid, { text: '💀 *卂几ㄒ丨-卩ㄖ尺几ㄖ ATTIVATO* 💀\n_La purificazione ha inizio._' });
        }
        if (cmd === 'off') {
            global.antiPornoActive = false;
            return await sock.sendMessage(remoteJid, { text: '🕯️ *ANTIPORNO DISATTIVATO*' });
        }
    }
};

// --- LOGICA DI MONITORAGGIO MEDIA (Da inserire nel tuo listener upsert) ---
async function monitorPorno(sock, m) {
    if (!global.antiPornoActive) return;

    const remoteJid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    
    // Rileva se il messaggio è un media (Immagine, Video o Sticker)
    const isMedia = m.message?.imageMessage || m.message?.videoMessage || m.message?.stickerMessage;

    // Se è un media, controlliamo se ha una didascalia (caption) sospetta
    // Nota: Baileys non scansiona il contenuto visivo dell'immagine da solo, 
    // ma noi blocchiamo i media sospetti basandoci su caption o attivando un filtro preventivo.
    const caption = m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || "";
    const forbiddenWords = ['porno', 'xxx', 'sex', 'nude', 'hentai']; // Aggiungi quelle che vuoi
    const hasForbiddenText = forbiddenWords.some(word => caption.toLowerCase().includes(word));

    if (isMedia && hasForbiddenText) {
        // 1. Check Admin
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
        if (isAdmin) return;

        // 2. Elimina il media
        await sock.sendMessage(remoteJid, { delete: m.key });

        // 3. Gestione Warn (3 totali)
        global.pornoWarns[sender] = (global.pornoWarns[sender] || 0) + 1;
        const count = global.pornoWarns[sender];

        if (count >= 3) {
            // BAN E BLOCCO
            await sock.groupParticipantsUpdate(remoteJid, [sender], "remove");
            await sock.updateBlockStatus(sender, "block");
            
            await sock.sendMessage(remoteJid, { text: `💀 *ANIMA DANNATA RIMOSSA* 💀\n@${sender.split('@')[0]} è stato inghiottito dall'oscurità per contenuti proibiti.`, mentions: [sender] });
            delete global.pornoWarns[sender];
        } else {
            // 4. INVIO IMMAGINE HORROR 🩸
            await sock.sendMessage(remoteJid, {
                image: { url: 'https://i.ibb.co/VvzYfPr/horror-eye.jpg' }, // Esempio immagine occhio inquietante/horror
                caption: `
卂几ㄒ丨-卩ㄖ尺见ㄖ 🩸

⚠️ *TI STIAMO OSSERVANDO...* @${sender.split('@')[0]}
Contenuti espliciti o sospetti non sono ammessi.

🚫 *Contenuto rimosso*
📉 *Warn:* [ ${count} / 3 ]
_Non peccare di nuovo o sarai rimosso e bloccato._
----------------------------------`,
                mentions: [sender]
            });
        }

        // 5. Log a te
        await sock.sendMessage("IL_TUO_NUMERO@s.whatsapp.net", { text: `🩸 *LOG ANTIPORNO*: wa.me/${sender.split('@')[0]} ha inviato media sospetti.` });
    }
}
