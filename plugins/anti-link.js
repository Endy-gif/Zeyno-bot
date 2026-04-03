const { jidDecode } = require('@whiskeysockets/baileys');

global.antiLinkActive = global.antiLinkActive || false;
global.linkWarns = global.linkWarns || {};

module.exports = {
    name: 'antilink',
    prefix: '!',
    async execute(sock, m, args) {
        const remoteJid = m.key.remoteJid;
        const cmd = args[0]?.toLowerCase();

        if (cmd === 'on') {
            global.antiLinkActive = true;
            return await sock.sendMessage(remoteJid, { text: '🔴⚫ *ANTILINK MILANISTA ATTIVATO* 🔴⚫' });
        }
        if (cmd === 'off') {
            global.antiLinkActive = false;
            return await sock.sendMessage(remoteJid, { text: '⚪ *ANTILINK DISATTIVATO*' });
        }
    }
};

// Funzione da richiamare nel tuo listener messaggi
async function handleAntiLink(sock, m) {
    if (!global.antiLinkActive) return;

    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    const isLink = /(https?:\/\/[^\s]+)/gi.test(text);

    if (isLink) {
        const sender = m.key.participant || m.key.remoteJid;
        const remoteJid = m.key.remoteJid;

        // Check Admin
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
        if (isAdmin) return;

        // 1. Elimina il link immediatamente
        await sock.sendMessage(remoteJid, { delete: m.key });

        // 2. Warn Logic (3 totali)
        global.linkWarns[sender] = (global.linkWarns[sender] || 0) + 1;
        const count = global.linkWarns[sender];

        if (count >= 3) {
            await sock.groupParticipantsUpdate(remoteJid, [sender], "remove");
            await sock.sendMessage(remoteJid, { text: '🔴⚫ *FUORI DAI GIOCHI!* @' + sender.split('@')[0] + ' espulso per spam.', mentions: [sender] });
            delete global.linkWarns[sender];
        } else {
            // 3. INVIO IMMAGINE MILAN 🔴⚫
            await sock.sendMessage(remoteJid, {
                image: { url: 'https://wallpapercave.com/wp/wp10505191.jpg' }, // Esempio: Logo Milan
                caption: `
[̲̅A̲̅][̲̅N̲̅][̲̅T̲̅][̲̅I̲̅]-[̲̅L̲̅][̲̅I̲̅][̲̅N̲̅][̲̅K̲̅] 🔴⚫

⚠️ *NON SI SPAMMA QUI!* @${sender.split('@')[0]}
Questo gruppo è protetto dal Diavolo. 😈

🚫 *Messaggio rimosso*
📈 *Warn:* [ ${count} / 3 ]
`,
                mentions: [sender]
            });
        }
    }
}
