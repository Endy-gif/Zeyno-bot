import { getContentType, jidNormalizedUser } from '@realvare/baileys';
import chalk from 'chalk';
import config from './config.js';
import fs from 'fs';
import path from 'path';

// ====================== GLOBAL COMMANDS ======================
global.plugins = {};
global.commands = new Map();

// Carica tutti i comandi dalla cartella commands
const loadCommands = async () => {
    const commandsDir = path.join(process.cwd(), 'commands');
    if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir);

    const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    for (const file of files) {
        try {
            const module = await import(`./commands/\( {file}?update= \){Date.now()}`);
            if (module.default) {
                const cmd = module.default;
                global.plugins[file.replace('.js', '')] = cmd;
                
                if (cmd.command) {
                    const cmdList = Array.isArray(cmd.command) ? cmd.command : [cmd.command];
                    cmdList.forEach(c => {
                        global.commands.set(c.toLowerCase(), cmd);
                    });
                }
            }
        } catch (e) {
            console.log(chalk.red(`❌ Errore nel caricamento di ${file}:`), e.message);
        }
    }
    console.log(chalk.green(`✅ Caricati ${global.commands.size} comandi`));
};

await loadCommands();

export async function handler(m) {
    if (!m) return;

    const conn = global.conn;
    const type = getContentType(m.message) || 'conversation';
    const body = (m.message?.conversation || 
                  m.message?.extendedTextMessage?.text || 
                  m.message?.imageMessage?.caption || 
                  m.message?.videoMessage?.caption || 
                  '').trim();

    const isCmd = body.startsWith(global.prefix.source.replace('^', '')) || 
                  config.prefixes.some(p => body.startsWith(p));

    const prefix = isCmd ? body[0] : '';
    const args = body.slice(1).trim().split(/ +/).slice(1);
    const command = body.slice(1).trim().split(/ +/).shift()?.toLowerCase() || '';
    const text = args.join(" ");

    const from = m.key.remoteJid;
    const sender = m.key.participant || from;
    const pushName = m.pushName || "Utente";
    const isGroup = from.endsWith('@g.us');
    const owner = global.owner.includes(sender.replace('@s.whatsapp.net', ''));

    // ====================== RISPOSTA BASE ======================
    m.reply = async (text, options = {}) => {
        return await conn.sendMessage(from, { 
            text: text 
        }, { quoted: m, ...options });
    };

    // ====================== LOG ======================
    if (isCmd) {
        console.log(
            chalk.black.bgGreen(` [CMD] `) + 
            chalk.cyan(` ${command} `) +
            chalk.gray(`from ${pushName} ${isGroup ? '(Gruppo)' : '(Privato)'}`)
        );
    }

    // ====================== ESECUZIONE COMANDO ======================
    if (isCmd && global.commands.has(command)) {
        const cmd = global.commands.get(command);

        try {
            // Controllo Owner
            if (cmd.owner && !owner) {
                return m.reply("❌ Questo comando è solo per gli Owner!");
            }

            // Controllo Gruppo
            if (cmd.group && !isGroup) {
                return m.reply("❌ Questo comando può essere usato solo nei gruppi!");
            }

            await cmd.execute(conn, m, {
                command,
                args,
                text,
                from,
                sender,
                pushName,
                isGroup,
                owner,
                prefix
            });

        } catch (err) {
            console.error(chalk.red(`Errore comando ${command}:`), err);
            m.reply(`⚠️ Errore nell'esecuzione del comando:\n${err.message}`);
        }
    }

    // ====================== RISPOSTA SENZA PREFISSO (opzionale) ======================
    if (!isCmd && body.toLowerCase().startsWith('zeyno')) {
        m.reply("👋 Ciao! Usa !menu per vedere i comandi.");
    }
}

// ====================== ESPORTAZIONE ======================
export default {
    handler
};

// Ricarica automatica comandi (utile durante sviluppo)
if (process.env.NODE_ENV !== 'production') {
    fs.watch('./commands', (eventType, filename) => {
        if (filename && filename.endsWith('.js')) {
            console.log(chalk.yellow(`♻️ Ricaricamento comando: ${filename}`));
            loadCommands();
        }
    });
}