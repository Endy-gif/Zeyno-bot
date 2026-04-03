process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

import './config.js';
import { createRequire } from 'module';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'process';
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, rmSync } from 'fs';
import yargs from 'yargs';
import chalk from 'chalk';
import { format } from 'util';
import pino from 'pino';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import { Low, JSONFile } from 'lowdb';
import NodeCache from 'node-cache';

const DisconnectReason = {
    connectionClosed: 428,
    connectionLost: 408,
    connectionReplaced: 440,
    timedOut: 408,
    loggedOut: 401,
    badSession: 500,
    restartRequired: 515,
    multideviceMismatch: 411,
};

const { useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser, makeInMemoryStore } = await import('@realvare/baileys');
const PORT = process.env.PORT || 3000;

protoType();
serialize();

global.isLogoPrinted = false;
global.qrGenerated = false;
global.connectionMessagesPrinted = {};

let methodCodeQR = process.argv.includes("qr");
let methodCode = process.argv.includes("code");
let phoneNumber = global.botNumberCode;

// ====================== GLOBAL FUNCTIONS ======================
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};

global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true));
};

global.__require = createRequire(import.meta.url);

global.timestamp = { start: new Date };
const __dirname = global.__dirname(import.meta.url);

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());

// ====================== PREFISSI ZEYN O BOT ======================
global.prefix = new RegExp('^[' + (opts['prefix'] || '!?.#/\\').replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') + ']');

global.db = new Low(new JSONFile('database.json'));
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise(resolve => setTimeout(() => resolve(global.loadDatabase()), 1000));
    if (global.db.data !== null) return;
    global.db.READ = true;
    await global.db.read();
    global.db.READ = null;
    global.db.data = {
        users: {},
        chats: {},
        settings: {},
        ...(global.db.data || {}),
    };
};
loadDatabase();

// ====================== SESSIONE ======================
global.authFile = 'session';
const { state, saveCreds } = await useMultiFileAuthState(global.authFile);
const msgRetryCounterCache = new NodeCache();

const logger = pino({ level: 'silent' });
global.store = makeInMemoryStore({ logger });

// ====================== OWNERS ZEYN O BOT ======================
global.owner = [
    '393501989497',
    '447449205584'
];

// ====================== CONNESSIONE ======================
const connectionOptions = {
    logger: logger,
    browser: Browsers.macOS('Safari'),
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: methodCodeQR || methodCode ? true : false,
    cachedGroupMetadata: async (jid) => global.groupCache?.get(jid),
    getMessage: async (key) => (await global.store.loadMessage(key.remoteJid, key.id))?.message || undefined,
    msgRetryCounterCache,
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 5,
};

global.conn = makeWASocket(connectionOptions);
global.store.bind(global.conn.ev);

// ====================== LOGO ZEYN O BOT ======================
function printZeynoLogo() {
    if (global.isLogoPrinted) return;
    
    console.log(chalk.bold.hex('#00BFFF')(`
╔════════════════════════════════════════════╗
║              ███████╗███████╗██╗   ██╗     ║
║              ╚══███╔╝██╔════╝╚██╗ ██╔╝     ║
║                ███╔╝ █████╗   ╚████╔╝      ║
║               ███╔╝  ██╔══╝    ╚██╔╝       ║
║              ███████╗███████╗   ██║        ║
║              ╚══════╝╚══════╝   ╚═╝        ║
╚════════════════════════════════════════════╝`));

    console.log(chalk.bold.hex('#00CED1')('                ZEYNO BOT - MD'));
    console.log(chalk.hex('#2ECC71')(`                Versione 1.0.0\n`));
    
    global.isLogoPrinted = true;
}

// ====================== CONNECTION UPDATE ======================
async function connectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !global.qrGenerated) {
        console.log(chalk.bold.yellow('\n📱 SCANNA IL QR CODE PER COLLEGARTI'));
        global.qrGenerated = true;
    }

    if (connection === 'open') {
        printZeynoLogo();
        console.log(chalk.green.bold(`✅ ${global.botName || "Zeyno Bot"} è ONLINE!`));
        console.log(chalk.cyan(`👑 Owners: 393501989497 & 447449205584`));
    }

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.red.bold('❌ Sessione scaduta. Elimina la cartella "session" e riavvia.'));
            process.exit(0);
        } else {
            console.log(chalk.yellow('🔄 Riavvio in corso...'));
            setTimeout(() => global.reloadHandler(true), 3000);
        }
    }
}

// ====================== AVVIO ======================
(async () => {
    conn.ev.on('connection.update', connectionUpdate);
    conn.ev.on('creds.update', saveCreds);
})();

global.reloadHandler = async function (restatConn = false) {
    // Qui dopo caricheremo handler.js
    console.log(chalk.blue('🔄 Handler ricaricato'));
};