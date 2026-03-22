import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import NodeCache from 'node-cache'
import { getAggregateVotesInPollMessage, toJid } from '@realvare/baileys'

global.rcanal = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363424041538498@newsletter',
      newsletterName: '𝐙𝐄𝐘𝐍𝐎 𝐁𝐎𝐓',
      serverMessageId: 1
    }
  }
}
global.getRcanal = (extra = {}) => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363424041538498@newsletter',
    newsletterName: '𝐙𝐄𝐘𝐍𝐎 𝐁𝐎𝐓',
    serverMessageId: 1
  },
  ...extra
})

global.ignoredUsersGlobal = new Set()
global.ignoredUsersGroup = {}
global.groupSpam = {}

global.ignoredUsersGlobal = new Set()
global.ignoredUsersGroup = {}
global.groupSpam = {}

if (!global.groupCache) {
    global.groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })
}
if (!global.jidCache) {
    global.jidCache = new NodeCache({ stdTTL: 600, useClones: false })
}
if (!global.nameCache) {
    global.nameCache = new NodeCache({ stdTTL: 600, useClones: false });
}

export const fetchMetadata = async (conn, chatId) => await conn.groupMetadata(chatId)

const fetchGroupMetadataWithRetry = async (conn, chatId, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await conn.groupMetadata(chatId);
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

if (!global.cacheListenersSet) {
    const conn = global.conn
    if (conn) {
        conn.ev.on('groups.update', async (updates) => {
            for (const update of updates) {
                if (!update || !update.id) {
                    continue;
                }
                try {
                    const metadata = await fetchGroupMetadataWithRetry(conn, update.id)
                    if (!metadata) {
                        continue
                    }
                    global.groupCache.set(update.id, metadata, { ttl: 300 })
                } catch (e) {
                    if (!e.message?.includes('not authorized') && !e.message?.includes('chat not found') && !e.message?.includes('not in group')) {
                        console.error(`[ERRORE] Errore nell'aggiornamento cache su groups.update per ${update.id}:`, e)
                    }
                }
            }
        })
        global.cacheListenersSet = true
    }
}

if (!global.pollListenerSet) {
    const conn = global.conn
    if (conn) {
        conn.ev.on('messages.update', async (chatUpdate) => {
            for (const { key, update } of chatUpdate) {
                if (update.pollUpdates) {
                    try {
                        const pollCreation = await global.store.getMessage(key)
                        if (pollCreation) {
                            await getAggregateVotesInPollMessage({
                                message: pollCreation,
                                pollUpdates: update.pollUpdates,
                            })
                        }
                    } catch (e) {
                        console.error('[ERRORE] Errore nel gestire poll update:', e)
                    }
                }
            }
        })
        global.pollListenerSet = true
    }
}

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))
const responseHandlers = new Map()

function initResponseHandler(conn) {
    if (!conn.waitForResponse) {
        conn.waitForResponse = async (chat, sender, options = {}) => {
            const {
                timeout = 30000,
                validResponses = null,
                onTimeout = null,
                filter = null
            } = options
            return new Promise((resolve) => {
                const key = chat + sender
                const timeoutId = setTimeout(() => {
                    responseHandlers.delete(key)
                    if (onTimeout) onTimeout()
                    resolve(null)
                }, timeout)
                responseHandlers.set(key, {
                    resolve,
                    timeoutId,
                    validResponses,
                    filter
                })
            })
        }
    }
}

global.processedCalls = global.processedCalls || new Map()
if (global.conn && global.conn.ws) {
    global.conn.ws.on('CB:call', async (json) => {
        try {
            if (!json?.tag || json.tag !== 'call' || !json.attrs?.from) {
                return
            }
            const callerId = global.conn.decodeJid(json.attrs.from)
            const isOwner = global.owner.some(([num]) => num === callerId.split('@')[0])
            if (isOwner) return

            const eventId = json.attrs.id
            let actualCallId = null
            if (json.content?.length > 0) {
                for (const item of json.content) {
                    if (item.attrs && item.attrs['call-id']) {
                        actualCallId = item.attrs['call-id']
                        break
                    }
                }
            }
            const uniqueCallId = actualCallId || eventId
            if (json.content?.length > 0) {
                const contentTags = json.content.map(item => item.tag)
                if (contentTags.includes('terminate')) {
                    global.processedCalls.delete(uniqueCallId)
                    return
                }
                if (contentTags.includes('relaylatency')) {
                    if (global.processedCalls.has(uniqueCallId)) {
                        return
                    }
                    global.processedCalls.set(uniqueCallId, true)

                    const numero = callerId.split('@')[0]
                    let nome = global.nameCache.get(callerId);
                    if (!nome) {
                      nome = global.conn.getName(callerId) || 'Sconosciuto'
                      global.nameCache.set(callerId, nome);
                    }
                    console.log(`[📞] chiamata in arrivo da ${numero} - ${nome}`)

                    if (!global.db.data) await global.loadDatabase()
                    let settings = global.db.data?.settings?.[global.conn.user.jid]
                    if (!settings) {
                        settings = global.db.data.settings[global.conn.user.jid] = {
                            jadibotmd: false,
                            antiPrivate: true,
                            soloCreatore: false,
                            anticall: true,
                            status: 0
                        }
                    }
                    if (!settings.anticall) return

                    let user = global.db.data.users[callerId] || (global.db.data.users[callerId] = { callCount: 0, banned: false })
                    if (user.banned) {
                        await global.conn.rejectCall(uniqueCallId, callerId)
                        return
                    }
                    user.callCount = (user.callCount || 0) + 1
                    try {
                        await global.conn.rejectCall(uniqueCallId, callerId)
                        console.log(`[📞] chiamata di ${numero} - ${nome} rifiutata`)
                        if (user.callCount >= 3) {
                            user.banned = true
                            user.bannedReason = 'Troppi tentativi di chiamata'
                            const msg = `⚠️ *𝐙𝐄𝐘𝐍𝐎 𝐓𝐢𝐦𝐞𝐫*\n\n🚫 Mamma mia quanto puoi essere così down da essere bannato dal bot!\nBasta con ste chiamate, usa i comandi come una persona normale!\n\n━━━━━━━━━━━━━━━━━\n📌 *Stato:* Bannato\n⏰ *Durata:* Permanente\n━━━━━━━━━━━━━━━━━`
                            await global.conn.sendMessage(toJid(callerId), { text: msg })
                        } else {
                            const msg = `⛔ *𝐙𝐄𝐘𝐍𝐎 𝐀𝐓𝐓𝐞𝐧𝐭𝐢𝐨𝐧*\n\n📵 Le chiamate sono disabilitate, usa i comandi dio porco!\n\n━━━━━━━━━━━━━━━━━\n📌 *Tentativi rimanenti:* ${3 - user.callCount}\n⚡ *Attenzione:* Continua e verrai bannato!\n━━━━━━━━━━━━━━━━━`
                            await global.conn.sendMessage(toJid(callerId), { text: msg })
                        }
                    } catch (err) {
                        console.error('[ERRORE] Errore nel gestire la chiamata:', err)
                        global.processedCalls.delete(uniqueCallId)
                    }
                }
            }
        } catch (e) {
            console.error('[ERRORE] Errore generale gestione chiamata:', e)
        }
    })
}

setInterval(() => {
    if (global.processedCalls.size > 10) {
        global.processedCalls.clear()
    }

}, 180000)

export async function participantsUpdate({ id, participants, action }) {
    if (global.db.data.chats[id]?.rileva === false) return

    try {
        let metadata = global.groupCache.get(id) || await fetchMetadata(this, id)
        if (!metadata) return

        global.groupCache.set(id, metadata, { ttl: 300 })
        for (const user of participants) {
            const normalizedUser = this.decodeJid(user)
            let userName = global.nameCache.get(normalizedUser);
            if (!userName) {
              userName = (await this.getName(normalizedUser)) || normalizedUser.split('@')[0] || 'Sconosciuto'
              global.nameCache.set(normalizedUser, userName);
            }
            switch (action) {