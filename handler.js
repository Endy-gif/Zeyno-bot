import { getContentType } from '@realvare/baileys';
import chalk from 'chalk';
import config from './config.js';
import fs from 'fs';
import path from 'path';

// ====================== CARICAMENTO COMANDI ======================
global.plugins = {};
global.commands = new Map();

const loadCommands = async () => {
    const commandsDir = path.join(process.cwd(), 'commands');
    if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir, { recursive: true });

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
            console.log(chalk.red(`❌ Errore caricamento ${file}:`), e.message);
        }
    }
    console.log(chalk.green(`✅ ${global.commands.size} comandi caricati`));
};

await loadCommands();

// ====================== HANDLER PRINCIPALE ======================
export async function handler(m) {
    if (!m) return;

    const conn = global.conn;
    const type = getContentType(m.message) || 'conversation';
    
    const body = (m.message?.conversation ||
                  m.message?.extendedTextMessage?.text ||
                  m.message?.imageMessage?.caption ||
                  m.message?.videoMessage?.caption || '').trim();

    const from = m.key.remoteJid;
    const sender = m.key.participant || from;
    const pushName = m.pushName || "Utente";
    const isGroup = from.endsWith('@g.us');

    // ====================== CONTROLLI PERMESSI ======================
    const isOwner = config.isOwner(sender);
    const isStaff = config.isStaff(sender);
    const isPremium = config.isPremium(sender);

    // ====================== PREFISSO ======================
    const prefix = config.prefixes.find(p => body.startsWith(p));
    const isCmd = !!prefix;

    if (!isCmd) {
        // Risposta senza prefisso (opzionale)
        if (body.toLowerCase().startsWith('zeyno') || body.toLowerCase() === 'bot') {
            return m.reply(`👋 Ciao ${pushName}!\nUsa *!menu* per vedere i comandi.`);
        }
        return;
    }

    const args = body.slice(1).trim().split(/ +/).slice(1);
    const command = body.slice(1).trim().split(/ +/).shift()?.toLowerCase() || '';
    const text = args.join(" ");

    // ====================== LOG ======================
    if (isCmd) {
        console.log(
            chalk.black.bgGreen(` [CMD] `) +
            chalk.cyan(` \( {prefix} \){command} `) +
            chalk.gray(`| ${pushName} ${isGroup ? '(Gruppo)' : '(Privato)'}`) +
            (isOwner ? chalk.red(' [OWNER]') : isStaff ? chalk.yellow(' [STAFF]') : '')
        );
    }

    // ====================== ESECUZIONE COMANDO ======================
    if (global.commands.has(command)) {
        const cmd = global.commands.get(command);

        try {
            // --- Controllo Permessi ---
            if (cmd.ownerOnly && !isOwner) {
                return m.reply("❌ Questo comando è riservato solo agli **Owner**.");
            }

            if (cmd.staffOnly && !isStaff) {
                return m.reply("❌ Questo comando è riservato allo **Staff**.");
            }

            if (cmd.groupOnly && !isGroup) {
                return m.reply("❌ Questo comando può essere usato solo nei **gruppi**.");
            }

            if (cmd.privateOnly && isGroup) {
                return m.reply("❌ Questo comando può essere usato solo in **chat privata**.");
            }

            // Esegui il comando
            await cmd.execute(conn, m, {
                command,
                args,
                text,
                from,
                sender,
                pushName,
                isGroup,
                isOwner,
                isStaff,
                isPremium,
                prefix
            });

        } catch (err) {
            console.error(chalk.red(`Errore nel comando ${command}:`), err);
            await m.reply(`⚠️ *Errore nell'esecuzione del comando*\n\n${err.message}`);
        }
    }
}

// ====================== AUTO RELOAD COMANDI (Sviluppo) ======================
if (process.env.NODE_ENV !== 'production') {
    fs.watch('./commands', (event, filename) => {
        if (filename?.endsWith('.js')) {
            console.log(chalk.yellow(`♻️ Ricaricamento: ${filename}`));
            loadCommands();
        }
    });
}

export default { handler };