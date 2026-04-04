Process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
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
    const v1 = chalk.hex('#8A2BE2'); 
    const v2 = chalk.hex('#4169E1'); 
    const v3 = chalk.hex('#1E90FF'); 
    const neon = chalk.hex('#00FFFF'); 
    const whiteSoft = chalk.hex('#F8F8FF'); 

    const a = v1('╭━━━━━━━━━━━━━• 𝐙𝐄𝐘𝐍𝐎 𝐂𝐎𝐑𝐄 •━━━━━━━━━━━━━');
    const b = v1('╰━━━━━━━━━━━━━• 𝐙𝐄𝐘𝐍𝐎 𝐄𝐍𝐃 •━━━━━━━━━━━━━');
    const linea = v2('   ─────────◈────────◈─────────◈─────────');
    const sm = neon.bold('   🧬 PROTOCOLLO ZEYNO INITIALIZED 🧬');

    const qr = v3(' ⧈') + ' ' + chalk.bold.white('MODALITÀ [1]: Link tramite QR');
    const codice = v3(' ⧈') + ' ' + chalk.bold.white('MODALITÀ [2]: Link tramite Pairing');

    const istruzioni = [
        v3(' ❯') + whiteSoft.italic(' Caricamento moduli Zeyno...'),
        v3(' ❯') + whiteSoft.italic(' Scegli il metodo di connessione.'),
        whiteSoft.italic(''),
        v1.italic('                𝐙𝐄𝐘𝐍𝐎 𝐒𝐘𝐒𝐓𝐄𝐌 • 𝐕𝟐.𝟎.𝟎'),
    ];

    const prompt = neon.bold('\n⧈ zeyno-auth ➤ ');

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
        console.log(`\n${chalk.red.bold('✖ ERRORE CRITICO: ZEYNO-SYSTEM-FAILURE')}

${whiteSoft('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.red.bold('⚠️ Kernel non risponde al comando.')} 
${whiteSoft('┌─⭓ Parametri accettati:')} ${chalk.bold.cyan('1')} ${whiteSoft('e')} ${chalk.bold.cyan('2')}
${whiteSoft('└─⭓ Riprova l\'inserimento manuale.')}
${v3.italic('\nZeyno OS Support: Contatta lo sviluppatore per assistenza.')}
`);
    }
    } while ((opzione !== '1' && opzione !== '2') || fs.existsSync(`./${authFile}/creds.json`));
}

const groupMetadataCache = new NodeCache({ stdTTL: 300, useClones: false });
global.groupCache = groupMetadataCache;
const logger = pino({
    level: 'silent',
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
            console.error('Errore pulizia store Zeyno:', e);
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
    printQRInTerminal
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
            global.groupCache.set(jid, metadata, { ttl: 300 });
            return metadata;
        } catch (err) {
            console.error('Errore metadati Zeyno:', err);
            return {};
        }
    },
    getMessage: async (key) => {
        try {
            const jid = global.conn.decodeJid(key.remoteJid);
            const msg = await global.store.loadMessage(jid, key.id);
            return msg?.message || undefined;
        } catch (error) {
            console.error('Errore Zeyno Message Fetch:', error);
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
                phoneNumber = await question(chalk.bgBlack(chalk.bold.hex('#8A2BE2')(`Inserisci numero ZeynoBot.\n${chalk.bold.hex('#00FFFF')("Esempio: +393471234567")}\n${chalk.bold.hex('#4169E1')('━━► ')}`)));
                addNumber = phoneNumber.replace(/\D/g, '');
                if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber}`;
            }
            setTimeout(async () => {
                let codeBot = await conn.requestPairingCode(addNumber, 'ZEYNOBOT');
                codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
                console.log(chalk.bold.white(chalk.bgHex('#8A2BE2')('🧬 CODICE ABBINAMENTO ZEYNO:')), chalk.bold.white(chalk.hex('#00FFFF')(codeBot)));
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
        console.log(chalk.bold.magenta(`\n 🧬 SCANSIONA QR ZEYNO - SCADENZA 45 SECONDI 🧬`));
        global.qrGenerated = true;
    }
    if (connection === 'open') {
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
                        text: `» Zeyno Online!\n⏱️ Tempo: ${elapsedSec}s\n🧾 Stato: Stabile`,
                        mentions: restartInfo.sender ? [restartInfo.sender] : []
                    });
                } catch (e) {
                    console.error('Errore post-restart Zeyno:', e);
                }
            }

            try {
                fs.unlinkSync(RESTART_FILE);
            } catch (e) {
                console.error('Errore file restart Zeyno:', e);
            }
        }
        global.qrGenerated = false;
        global.connectionMessagesPrinted = {};

        if (!global.isLogoPrinted) {
            const zeynoColors = [
    '#8A2BE2', '#4169E1', '#1E90FF', '#00FFFF', '#00FFFF', '#1E90FF', '#4169E1', '#8A2BE2',
    '#8A2BE2', '#4169E1', '#1E90FF', '#00FFFF', '#00FFFF', '#1E90FF'
];

const logoZeyno = `
________ ___________驰______      _________ 
\_____  \\_   _____驰\   \  / /____  \_   ___ \
 /   |   \|    __)_  \   \/ // __ \ /    \  \/
/    |    \        \  \   / \  ___/ \     \____
\_______  /_______  /   \驰/   \___  > \驰______  /
        \/        \/              \/           \/`;

// Stampa il logo in Viola Neon Grassetto
console.log(chalk.hex('#8A2BE2').bold(logoZeyno));

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
        if (reason === DisconnectReason.badSession) {
            if (!global.connectionMessagesPrinted.badSession) {
                            console.log(chalk.bold.hex('#FF00FF')(`\n⚠️ SESSIONE ZEYNO CORROTTA, PULISCI ${global.authFile} ⚠️`));
                global.connectionMessagesPrinted.badSession = true;
            }
            await global.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.connectionLost) {
            if (!global.connectionMessagesPrinted.connectionLost) {
                console.log(chalk.hex('#4169E1').bold(`\nLINK ZEYNO PERSO\nRICONNESSIONE... \n𝐙𝐄𝐘𝐍𝐎 𝚩𝚯𝐓`));
                global.connectionMessagesPrinted.connectionLost = true;
            }
            await global.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.connectionReplaced) {
            if (!global.connectionMessagesPrinted.connectionReplaced) {
                console.log(chalk.hex('#8A2BE2').bold(`COLLISIONE SESSIONE\nSessione duplicata rilevata.\n𝐙𝐄𝐘𝐍𝐎 𝐒𝐘𝐒𝐓𝐄𝐌`));
                global.connectionMessagesPrinted.connectionReplaced = true;
            }
        } else if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.bold.hex('#FF0000')(`\n⚠️ ZEYNO LOGOUT, RESET SESSIONE NECESSARIO ⚠️`));
            try {
                if (fs.existsSync(global.authFile)) {
                    fs.rmSync(global.authFile, { recursive: true, force: true });
                }
            } catch (e) {
                console.error('Errore wipe sessione:', e);
            }
            process.exit(1);
        } else if (reason === DisconnectReason.restartRequired) {
            if (!global.connectionMessagesPrinted.restartRequired) {
                console.log(chalk.hex('#1E90FF').bold(`\nREBOOT ZEYNO KERNEL`));
                global.connectionMessagesPrinted.restartRequired = true;
            }
            await global.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.timedOut) {
            if (!global.connectionMessagesPrinted.timedOut) {
                console.log(chalk.hex('#00FFFF').bold(`\nTIMEOUT ZEYNO\nRIPRISTINO...`));
                global.connectionMessagesPrinted.timedOut = true;
            }
            await global.reloadHandler(true).catch(console.error);
        } else if (reason !== DisconnectReason.connectionClosed) {
            if (!global.connectionMessagesPrinted.unknown) {
                console.log(chalk.bold.hex('#8B0000')(`\n⚠️ ERRORE ZEYNO-UNDEF: ${reason || '??'} >> ${connection || '??'}`));
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
        console.log(chalk.hex('#00FFFF').bold(`𝐙𝐄𝐘𝐍𝐎 𝚩𝚯𝐓 online e operativo`));
    } catch (error) {
        console.error(chalk.bold.bgHex('#4B0082')(`🥀 Zeyno Boot Error: `, error));
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
            console.error(chalk.red.bold('🧬 ZEYNO-CALL-ERROR:'), e);
        }
    };
    if (isInit) {
        conn.ev.on('messages.upsert', conn.handler);
        conn.ev.on('connection.update', conn.connectionUpdate);
        conn.ev.on('creds.update', conn.credsUpdate);
        if (conn.callUpdate) conn.ev.on('call', conn.callUpdate);
    }
    isInit = false;
    return true;
};
global.prefix = new RegExp('^[' + ('!?./#').replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') + ']');
conn.ev.on('group-participants.update', async (ani) => {
    if (!global.db.data.settings[ani.id]?.mantenance) {
        try {
            let metadata = await conn.groupMetadata(ani.id);
            let participants = ani.participants;
            for (let num of participants) {
                if (ani.action === 'add') {
                    const vCode = Math.random().toString(36).substring(2, 7).toUpperCase();
                    terminalLog('info', `Ingresso rilevato: ${num} | Verifica: ${vCode}`);
                    await conn.sendMessage(ani.id, {
                        image: { url: 'https://i.ibb.co/cy0v4V1/cyber-security.jpg' },
                        caption: `🔴 ⚫ W𝕰L𝕮OM𝕰 𝕿O 𝖅𝕰𝖄𝕹𝕺 ⚫ 🔴\n\nUtente: @${num.split('@')[0]}\nSistema: Cyber-Security\nCodice di accesso: *${vCode}*`,
                        mentions: [num]
                    });
                }
            }
        } catch (e) {
            terminalLog('error', `Evento Gruppo: ${e.message}`);
        }
    }
});
function terminalLog(type, msg) {
    const time = new Date().toLocaleTimeString();
    const color = type === 'error' ? chalk.red.bold : chalk.cyan.bold;
    console.log(`${chalk.gray(`[${time}]`)} ${color(`[ZEYNO-${type.toUpperCase()}]`)} ${msg}`);
}
process.on('unhandledRejection', (reason) => {
    terminalLog('error', `Rejection: ${reason}`);
});
const pluginFolder = path.join(__dirname, 'plugins');
const pluginFilter = filename => /\.js$/.test(filename);
global.plugins = {};
async function loadPlugins() {
    for (let filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            let name = path.join(pluginFolder, filename);
            const module = await import(pathToFileURL(name).href);
            global.plugins[filename] = module.default || module;
        } catch (e) {
            terminalLog('error', `Modulo ${filename} fallito.`);
        }
    }
}
loadPlugins().then(() => terminalLog('info', 'Sistemi Zeyno Operativi.'));
setInterval(() => {
    if (global.store) {
        global.store.messages = {};
        terminalLog('info', 'RAM Cache Zeyno svuotata.');
    }
}, 3600000);
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// STATUS: 100% OPERATIONAL | KERNEL: ZEYNO OS V2 | CALIBRATION: LINE 610 READY

