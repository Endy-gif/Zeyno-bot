process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { createRequire } from 'module';
import path, { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, rmSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
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
    forbidden: 403,
    unavailableService: 503
};
const { useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser, makeInMemoryStore } = await import('@realvare/baileys');
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
protoType();
serialize();
global.isLogoPrinted = false;
global.qrGenerated = false;
global.connectionMessagesPrinted = {};
let methodCodeQR = process.argv.includes("qr");
let methodCode = process.argv.includes("code");
let phoneNumber = global.botNumberCode;

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};

global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true));
};

global.__require = function require(dir = import.meta.url) {
    return createRequire(dir);
};

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '');
global.timestamp = { start: new Date };
const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[' + (opts['prefix'] || '§*/!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@').replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') + ']');
global.db = new Low(new JSONFile('database.json'));
global.DATABASE = global.db;
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (!global.db.READ) {
                    clearInterval(interval);
                    resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
                }
            }, 1 * 1000);
            setTimeout(() => {
                clearInterval(interval);
                global.db.READ = null;
                reject(new Error('loadDatabase timeout'));
            }, 15000);
        }).catch((e) => {
            console.error('[ERRORE] loadDatabase:', e.message);
            return global.loadDatabase();
        });
    }
    if (global.db.data !== null) return;
    global.db.READ = true;
    await global.db.read().catch(console.error);
    global.db.READ = null;
    global.db.data = {
        users: {},
        chats: {},
        settings: {},
        ...(global.db.data || {}),
    };
    global.db.chain = chain(global.db.data);
};
loadDatabase();

global.creds = 'creds.json';
global.authFile = 'session';

const { state, saveCreds } = await useMultiFileAuthState(global.authFile);
const msgRetryCounterCache = new NodeCache();
const question = (t) => {
    process.stdout.write(t);
    return new Promise((resolve) => {
        process.stdin.once('data', (data) => {
            resolve(data.toString().trim());
        });
    });
};

let opzione;
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${authFile}/creds.json`)) {
    do {
        const cyan = chalk.hex('#00BFFF');
        const purple = chalk.hex('#9D4EDD');
        const magenta = chalk.hex('#FF10F0');
        const lilla = chalk.hex('#C77DFF');
        const blu = chalk.hex('#3A86FF');
        const rosso = chalk.hex('#FF006E');
        const nero = chalk.hex('#000000');
        const whiteSoft = chalk.hex('#ECF0F1');

        const a = cyan('╭━━━━━━━━━━━━━• 𖣘𝐙𝐘𝐍𝐎 𝐂𝐎𝐑𝐄 •━━━━━━━━━━━━━');
        const b = cyan('╰━━━━━━━━━━━━━• 𖣘𝐙𝐘𝐍𝐎 𝐄𝐍𝐃 •━━━━━━━━━━━━━');
        const linea = purple('   ─────────◈────────◈─────────◈─────────');
        const sm = lilla.bold('   🔥 SISTEMA DI AUTENTICAZIONE 🔥');

        const qr = lilla(' 𖣘') + ' ' + chalk.bold.white('MODALITÀ [1]: Sincronizzazione QR');
        const codice = lilla(' 𖣘') + ' ' + chalk.bold.white('MODALITÀ [2]: Link tramite Codice');

        const istruzioni = [
            lilla(' ❯') + whiteSoft.italic(' Inizializzazione protocollo di accesso...'),
            lilla(' ❯') + whiteSoft.italic(' Scegli un\'opzione per stabilire il link.'),
            whiteSoft.italic(''),
            magenta.italic('                𖣘 𝐙𝐘𝐍𝐎 𝐒𝐘𝐒𝐓𝐄𝐌 • 𝐕𝟏.𝟎.𝟎'),
        ];

        const prompt = blu.bold('\n𖣘 zyno-auth ➤ ');

        opzione = await question(`\n
${a}

          ${sm}
${linea}

${qr}
${codice}

${linea}
${istruzioni.join('\n')}

${b}
${prompt}`);

        if (!/^[1-2]$/.test(opzione)) {
            console.log(`\n${rosso.bold('✖ ERRORE DI PROTOCOLLO: 𖣘𝐙𝐘𝐍𝐎-𝟦𝟢𝟦')}

${whiteSoft('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${rosso.bold('⚠️ Input non riconosciuto dal Core.')} 
${whiteSoft('┌─⭓ Sono validi solo i parametri')} ${chalk.bold.hex('#00FF00')('1')} ${whiteSoft('o')} ${chalk.bold.hex('#00FF00')('2')}
${whiteSoft('└─⭓ Non inserire simboli, spazi o lettere.')}
${magenta.italic('\nSupporto Tecnico: Contatta lo sviluppatore Endy nei gruppi')}
`);
        }
    } while ((opzione !== '1' && opzione !== '2') || fs.existsSync(`./${authFile}/creds.json`));
}

const groupMetadataCache = new NodeCache({ stdTTL: 604800, useClones: false }); // 7 giorni
global.groupCache = groupMetadataCache;
const logger = pino({
    level: 'info',
});
global.jidCache = new NodeCache({ stdTTL: 600, useClones: false });
global.store = makeInMemoryStore({ logger });

if (!global.__storePruneInterval) {
    global.__storePruneInterval = setInterval(() => {
        try {
            const store = global.store;
            if (!store || !store.messages) return;

            const MESSAGE_LIMIT = 40;
            for (const jid of Object.keys(store.messages)) {
                const list = store.messages[jid];
                const arr = list?.array;
                if (!arr || arr.length <= MESSAGE_LIMIT) continue;

                const keep = new Set(arr.slice(-MESSAGE_LIMIT).map(m => m?.key?.id).filter(Boolean));
                if (typeof list.filter === 'function') {
                    list.filter(m => keep.has(m?.key?.id));
                }
            }

            if (store.presences && typeof store.presences === 'object') {
                for (const k of Object.keys(store.presences)) delete store.presences[k];
            }

            if (global.gc) global.gc();
        } catch (e) {
            console.error('Errore pulizia store:', e);
        }
    }, 5 * 60 * 1000);
}

const makeDecodeJid = (jidCache) => {
    return (jid) => {
        if (!jid) return jid;
        const cached = jidCache.get(jid);
        if (cached) return cached;

        let decoded = jid;
        if (/:\d+@/gi.test(jid)) {
            decoded = jidNormalizedUser(jid);
        }
        if (typeof decoded === 'object' && decoded.user && decoded.server) {
            decoded = `${decoded.user}@${decoded.server}`;
        }
        jidCache.set(jid, decoded);
        return decoded;
    };
};
const connectionOptions = {
    logger: logger,
    browser: Browsers.macOS('Safari'),
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    decodeJid: makeDecodeJid(global.jidCache),
    printQRInTerminal: opzione === '1' || methodCodeQR ? true : false,
    cachedGroupMetadata: async (jid) => {
        const cached = global.groupCache.get(jid);
        if (cached) return cached;
        try {
            const metadata = await global.conn.groupMetadata(global.conn.decodeJid(jid));
            global.groupCache.set(jid, metadata, { ttl: 604800 }); // 7 giorni
            return metadata;
        } catch (err) {
            console.error('Errore nel recupero dei metadati del gruppo:', err);
            return {};
        }
    },
    getMessage: async (key) => {
        try {
            const jid = global.conn.decodeJid(key.remoteJid);
            const msg = await global.store.loadMessage(jid, key.id);
            return msg?.message || undefined;
        } catch (error) {
            console.error('Errore in getMessage:', error);
            return undefined;
        }
    },
    msgRetryCounterCache,
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 5,
    shouldIgnoreJid: jid => false,
};
global.conn = makeWASocket(connectionOptions);
global.store.bind(global.conn.ev);
if (!fs.existsSync(`./${authFile}/creds.json`)) {
    if (opzione === '2' || methodCode) {
        opzione = '2';
        if (!conn.authState.creds.registered) {
            let addNumber;
            if (phoneNumber) {
                addNumber = phoneNumber.replace(/[^0-9]/g, '');
            } else {
                phoneNumber = await question(chalk.bgBlack(chalk.bold.hex('#3A86FF')(`Inserisci il numero di WhatsApp.\n${chalk.bold.hex('#00FF00')("Esempio: +393471234567")}\n${chalk.bold.hex('#FF006E')('━━► ')}`)));
                addNumber = phoneNumber.replace(/\D/g, '');
                if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber}`;
            }
            setTimeout(async () => {
                let codeBot = await conn.requestPairingCode(addNumber, 'ZYNO');
                codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
                console.log(chalk.bold.white(chalk.bgHex('#9D4EDD')('📞 CODICE DI ABBINAMENTO:')), chalk.bold.white(chalk.hex('#00FF00')(codeBot)));
            }, 3000);
        }
    }
}
conn.isInit = false;
if (!opts['test']) {
    if (global.db) setInterval(async () => {
        if (global.db.data) await global.db.write();
        if (opts['autocleartmp']) {
            const tmp = ['temp'];
            tmp.forEach(dirName => {
                if (!existsSync(dirName)) return;
                try {
                    readdirSync(dirName).forEach(file => {
                        const filePath = join(dirName, file);
                        try {
                            const stats = statSync(filePath);
                            if (stats.isFile() && (Date.now() - stats.mtimeMs) > 2 * 60 * 1000) {
                                unlinkSync(filePath);
                            }
                        } catch {}
                    });
                } catch {}
            });
        }
    }, 30 * 1000);
}
if (opts['server']) (await import('./server.js')).default(global.conn, PORT);
async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin, qr } = update;
    global.stopped = connection;
    if (isNewLogin) conn.isInit = true;
    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
    if (code && code !== DisconnectReason.loggedOut) {
        await global.reloadHandler(true).catch(console.error);
        global.timestamp.connect = new Date;
    }
    if (global.db.data == null) await loadDatabase();
    if (qr && (opzione === '1' || methodCodeQR) && !global.qrGenerated) {
        console.log(chalk.bold.hex('#FF006E')(`\n 🪐 SCANSIONA IL CODICE QR - SCADE TRA 45 SECONDI 🪐`));
        global.qrGenerated = true;
    }
    if (connection === 'open') {
        const RESTART_FILE = path.resolve('./tmp/restart-state.json');

        if (fs.existsSync(RESTART_FILE)) {
            let restartInfo = null;
            let startupErrors = 0;

            try {
                restartInfo = JSON.parse(fs.readFileSync(RESTART_FILE, 'utf-8'));
            } catch (e) {
                startupErrors++;
            }

            if (restartInfo?.chat) {
                try {
                    const elapsedMs = Date.now() - (restartInfo.startedAt || Date.now());
                    const elapsedSec = (elapsedMs / 1000).toFixed(1);
                    const totalErrors = (restartInfo.errors || 0) + startupErrors;

                    await conn.sendMessage(restartInfo.chat, {
                        text: `» Riavvio completato!\n⏱️ Tempo: ${elapsedSec}s\n🧾 Errori: ${totalErrors}`,
                        mentions: restartInfo.sender ? [restartInfo.sender] : []
                    });
                } catch (e) {
                    console.error('Errore invio post-restart:', e);
                }
            }

            try {
                fs.unlinkSync(RESTART_FILE);
            } catch (e) {
                console.error('Errore eliminazione file restart:', e);
            }
        }
        global.qrGenerated = false;
        global.connectionMessagesPrinted = {};

        if (!global.isLogoPrinted) {
            const colorArray = [
                '#00BFFF', '#9D4EDD', '#FF10F0', '#C77DFF', '#3A86FF', '#FF006E', '#000000', '#00BFFF',
                '#9D4EDD', '#FF10F0', '#C77DFF', '#3A86FF', '#FF006E', '#000000'
            ];

            const zynoLogo = [
                ` ███████╗██╗   ██╗███╗   ██╗ ██████╗ `,
                `██╔════╝╚██╗ ██╔╝████╗  ██║██╔═══██╗`,
                `███████╗ ╚████╔╝ ██╔██╗ ██║██║   ██║`,
                `╚════██║  ╚██╔╝  ██║╚██╗██║██║   ██║`,
                `███████║   ██║   ██║ ╚████║╚██████╔╝`,
                `╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝ `
            ];

            zynoLogo.forEach((line, i) => {
                const color = colorArray[i] || colorArray[colorArray.length - 1];
                console.log(chalk.hex(color).bold(line));
            });

            global.isLogoPrinted = true;
        }
    }
    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
        if (reason === DisconnectReason.badSession) {
            if (!global.connectionMessagesPrinted.badSession) {
                console.log(chalk.bold.hex('#FF006E')(`\n⚠️❗ SESSIONE NON VALIDA, ELIMINA LA CARTELLA ${global.authFile} E SCANSIONA IL CODICE QR ⚠️`));
                global.connectionMessagesPrinted.badSession = true;
            }
            await global.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.connectionLost) {
            if (!global.connectionMessagesPrinted.connectionLost) {
                console.log(chalk.hex('#3A86FF').bold(`\nCONNESSIONE PERSA COL SERVER\nRICONNESSIONE IN CORSO... \n𖣘 𝐙𝐘𝐍𝐎 𝐁𝐎𝐓`));
                global.connectionMessagesPrinted.connectionLost = true;
            }
            await global.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.connectionReplaced) {
            if (!global.connectionMessagesPrinted.connectionReplaced) {
                console.log(chalk.hex('#3A86FF').bold(`CONNESSIONE SOSTITUITA\nÈ stata aperta un'altra sessione, \nchiudi prima quella attuale.\n𖣘 𝐙𝐘𝐍𝐎 𝐁𝐎𝐓`));
                global.connectionMessagesPrinted.connectionReplaced = true;
            }
        } else if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.bold.hex('#FF006E')(`\n⚠️ DISCONNESSO, CARTELLA ${global.authFile} ELIMINATA. RIAVVIA IL BOT E SCANSIONA IL CODICE QR ⚠️`));
            try {
                if (fs.existsSync(global.authFile)) {
                    fs.rmSync(global.authFile, { recursive: true, force: true });
                }
            } catch (e) {
                console.error('Errore nell\'eliminazione della cartella sessione:', e);
            }
            process.exit(1);
        } else if (reason === DisconnectReason.restartRequired) {
            if (!global.connectionMessagesPrinted.restartRequired) {
                console.log(chalk.hex('#00BFFF').bold(`\nCONNESSIONE AL SERVER`));
                global.connectionMessagesPrinted.restartRequired = true;
            }
            await global.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.timedOut) {
            if (!global.connectionMessagesPrinted.timedOut) {
                console.log(chalk.hex('#3A86FF').bold(`\nTIMEOUT CONNESSIONE\nRICONNESSIONE IN CORSO...\n𖣘 𝐙𝐘𝐍𝐎 𝐁𝐎𝐓`));
                global.connectionMessagesPrinted.timedOut = true;
            }
            await global.reloadHandler(true).catch(console.error);
        } else if (reason !== DisconnectReason.connectionClosed) {
            if (!global.connectionMessagesPrinted.unknown) {
                console.log(chalk.bold.hex('#FF006E')(`\n⚠️❗ MOTIVO DISCONNESSIONE SCONOSCIUTO: ${reason || 'Non trovato'} >> ${connection || 'Non trovato'}`));
                global.connectionMessagesPrinted.unknown = true;
            }
            await global.reloadHandler(true).catch(console.error);
        }
    }
}
process.on('uncaughtException', console.error);
(async () => {
    try {
        conn.ev.on('connection.update', connectionUpdate);
        conn.ev.on('creds.update', saveCreds);
        console.log(chalk.hex('#C77DFF').bold(`𖣘 𝐙𝐘𝐍𝐎 𝐁𝐎𝐓 connesso correttamente`));
    } catch (error) {
        console.error(chalk.bold.bgHex('#FF006E')(`🔥 Errore nell'avvio del bot: `, error));
    }
})();
let isInit = true;
let handler = await import('./handler.js');
global.reloadHandler = async function (restatConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) handler = Handler;
    } catch (e) {
        console.error(e);
    }
    if (restatConn) {
        try {
            global.conn.ws.close();
        } catch { }
        global.cacheListenersSet = false;
        conn.ev.removeAllListeners();
        global.conn = makeWASocket(connectionOptions);
        global.store.bind(global.conn.ev);
        isInit = true;
    }
    if (!isInit) {
        conn.ev.off('messages.upsert', conn.handler);
        conn.ev.off('connection.update', conn.connectionUpdate);
        conn.ev.off('creds.update', conn.credsUpdate);
        if (conn.callUpdate) conn.ev.off('call', conn.callUpdate);
    }
    conn.handler = handler.handler.bind(global.conn);
    conn.connectionUpdate = connectionUpdate.bind(global.conn);
    conn.credsUpdate = saveCreds;
    conn.callUpdate = async (calls) => {
        try {
            global.processedCalls = global.processedCalls || new Map();
            for (const call of calls || []) {
                const status = call?.status;
                const callId = call?.id;
                const callFrom = call?.from;
                if (!status || !callId || !callFrom) continue;

                if (status === 'terminate') {
                    global.processedCalls.delete(callId);
                    continue;
                }
                if (status !== 'offer') continue;
                if (global.processedCalls.has(callId)) continue;
                global.processedCalls.set(callId, true);

                const anticallPlugin = global.plugins?.['anti-call.js'];
                if (anticallPlugin && typeof anticallPlugin.onCall === 'function') {
                    anticallPlugin.onCall.call(conn, call, { conn, callId, callFrom }).catch(() => {});
                }
            }
        } catch (e) {
         