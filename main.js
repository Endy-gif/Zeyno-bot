import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import chalk from 'chalk';
import figlet from 'figlet';
import qrcode from 'qrcode';
import { 
    default as makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers 
} from '@whiskeysockets/baileys';

import config from './config.js';
import { handleMessages } from './handlers/messageHandler.js';

// Cache per messaggi e anti-spam
const msgCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Banner Zeyno Bot
console.clear();
console.log(chalk.cyan(figlet.textSync('ZEYNO BOT', { horizontalLayout: 'full' })));
console.log(chalk.yellow(`\nVersione: ${config.version} | Prefix: ${config.prefixes.join(' ')}\n`));

// ====================== FUNZIONE PRINCIPALE ======================
async function startZeynoBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        logger: undefined,
        markRead: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            return { conversation: 'Zeyno Bot' };
        }
    });

    // ====================== EVENTI ======================

    // Connessione / QR Code
    sock.ev.process((events) => {
        if (events['connection.update']) {
            const update = events['connection.update'];
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrcode.toString(qr, { type: 'terminal', small: true }, (err, qrcode) => {
                    console.log(chalk.green("\n📱 SCAN QR CODE QUI:\n"));
                    console.log(qrcode);
                });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                    : true;

                console.log(chalk.red(`❌ Connessione chiusa: ${lastDisconnect?.error?.message}`));

                if (shouldReconnect) {
                    console.log(chalk.yellow("🔄 Riavvio in corso..."));
                    setTimeout(startZeynoBot, 3000);
                } else {
                    console.log(chalk.red("❌ Logout manuale. Cancella la cartella 'sessions' per nuovo login."));
                }
            } 
            else if (connection === 'open') {
                console.log(chalk.green(`✅ ${config.botName} è online!`));
                console.log(chalk.cyan(`👑 Owner: ${config.ownerName}`));
            }
        }

        // Salvataggio sessione
        if (events['creds.update']) {
            saveCreds();
        }

        // ====================== MESSAGGI ======================
        if (events['messages.upsert']) {
            const { messages, type } = events['messages.upsert'];
            
            for (const msg of messages) {
                if (type === 'notify' || type === 'append') {
                    handleMessages(sock, msg, msgCache, config);
                }
            }
        }

        // ====================== GRUPPI ======================
        if (events['group-participants.update']) {
            const update = events['group-participants.update'];
            // Gestione welcome / goodbye / promote / demote
            handleGroupUpdate(sock, update);
        }

        if (events['groups.update']) {
            console.log(chalk.blue("📋 Gruppo aggiornato"));
        }
    });

    // Gestione comandi da terminale (utile per debug)
    rl.on('line', (input) => {
        if (input.toLowerCase() === 'restart') {
            console.log(chalk.yellow("Riavvio bot..."));
            process.exit(0);
        }
    });

    return sock;
}

// ====================== GESTIONE GRUPPI (placeholder) ======================
async function handleGroupUpdate(sock, update) {
    const { id, participants, action } = update;

    try {
        if (action === 'add') {
            for (const user of participants) {
                await sock.sendMessage(id, { 
                    text: config.welcomeMessage
                        .replace('@user', `@${user.split('@')[0]}`)
                        .replace('@group', (await sock.groupMetadata(id)).subject)
                }, { mentions: [user] });
            }
        } 
        else if (action === 'remove') {
            for (const user of participants) {
                await sock.sendMessage(id, { 
                    text: config.goodbyeMessage.replace('@user', `@${user.split('@')[0]}`) 
                }, { mentions: [user] });
            }
        }
    } catch (err) {
        console.log(chalk.red("Errore gestione gruppo:"), err);
    }
}

// ====================== AVVIO DEL BOT ======================
startZeynoBot()
    .catch(err => {
        console.error(chalk.red("Errore fatale:"), err);
        process.exit(1);
    });