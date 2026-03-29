import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import chalk from 'chalk'
import fs from 'fs'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import zeyno from 'zeyno'
import moment from 'moment-timezone'
import NodeCache from 'node-cache'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const moduleCache = new NodeCache({ stdTTL: 300 });

global.owner = [
  ['393282003292', 'εɳ∂ყ', true],
  ['393926427789', 'knor', true],
  ['12343764029', 'estreia', true],
  ['4915510397189', 'ksav', true],
  ['212693877842', 'medalis', true]
  ['85253382438', 'noxtra', true]
  ['212776999865', 'vexa', true]
  [393518077116', 'xyra', true]
]
global.mods = ['xxxxxxxxxx', 'xxxxxxxxxx']
global.prems = ['xxxxxxxxxx', 'xxxxxxxxxx']

global.nomebot   = 'Ƶɛყŋơცơƚ'
global.nomepack  = 'Ƶɛყŋơცơƚ'
global.wm        = 'Ƶɛყŋơცơƚ'
global.autore    = 'εɳ∂ყ'
global.dev       = 'εɳ∂ყ'
global.versione  = pkg.version
global.testobot  = `ZEYNO-BOT-V${pkg.version}`
global.errore    = '⚠️ *[SYSTEM ERROR]* Usa `.segnala` per inviare il log allo staff.'

global.repobot   = ''
global.canale    = ''

global.cheerio   = cheerio
global.fs        = fs
global.fetch     = fetch
global.zeyno     = zeyno
global.moment    = moment

global.APIKeys = {
    spotifyclientid: 'zeyno',
    spotifysecret:   'zeyno',
    browserless:     'zeyno',
    screenshotone:   'zeyno',
    tmdb:            'zeyno',
    gemini:          'zeyno',
    ocrspace:        'zeyno',
    assemblyai:      'zeyno',
    google:          'zeyno',
    googlex:         'zeyno',
    googleCX:        'zeyno',
    genius:          'zeyno',
    unsplash:        'zeyno',
    removebg:        'FEx4CYmYN1QRQWD1mbZp87jV',
    openrouter:      'axion',
    lastfm:          '36f859a1fc4121e7f0e931806507d5f9',
}

let filePath = fileURLToPath(import.meta.url)
let fileUrl = pathToFileURL(filePath).href

const reloadConfig = async () => {
  const cached = moduleCache.get(fileUrl);
  if (cached) return cached;

  unwatchFile(filePath)
  console.log(chalk.bgCyan.black(" SYSTEM ") + chalk.cyan(` File 'config.js' aggiornato con successo.`))

  const module = await import(`${fileUrl}?update=${Date.now()}`)
  moduleCache.set(fileUrl, module, { ttl: 300 });
  return module;
}

watchFile(filePath, reloadConfig)