import dotenv from 'dotenv';
dotenv.config();

export default {
    botName: "Zeyno Bot",
    version: "1.0.0",

    // ==================== OWNER ====================
    owners: [
        "393501989497@s.whatsapp.net",
        "447449205584@s.whatsapp.net"
    ],

    // ==================== STAFF ====================
    staff: [
        "393661122722@s.whatsapp.net",
        "66966415575@s.whatsapp.net",
        "212693877842@s.whatsapp.net"
    ],

    // ==================== PREFISSI ====================
    prefixes: ['!', '.', '?', '/', '#', '\\'],

    // ==================== IMPOSTAZIONI ====================
    autoRead: true,
    autoTyping: true,
    autoRecord: false,
    selfMode: false,

    // ==================== MESSAGGI ====================
    welcomeMessage: "👋 Benvenuto @user nel gruppo *@group*!\n\nUsa !menu per vedere i comandi.",
    goodbyeMessage: "👋 @user ha lasciato il gruppo.",

    // ==================== FUNZIONI DI CONTROLLO ====================
    isOwner: (jid) => {
        return config.owners.includes(jid);
    },

    isStaff: (jid) => {
        return config.staff.includes(jid) || config.isOwner(jid);
    },

    isPremium: (jid) => {
        return config.isOwner(jid) || config.isStaff(jid);
    }
};

// Rendi config globale
global.config = config;