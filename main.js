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
global.prefix = new RegExp('^[' + (opts['prefix'] || '*/!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@').replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') + ']');
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