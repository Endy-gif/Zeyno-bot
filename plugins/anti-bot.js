const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');

module.exports = {
    name: 'antibot',
    description: 'Attiva/Disattiva il sistema di sicurezza',
    prefix: '.',
    
    async execute(message, args, client) {
        // Controllo se l'utente ha i permessi di Admin per attivarlo
        if (!message.member.permissions.has('Administrator')) return;

        const state = args[0]?.toLowerCase();

        if (state === 'on') {
            // Messaggio di conferma attivazione
            message.channel.send("🛡️ **Sistema Anti-Bot ATTIVATO** (Modalità Ban H24)");

            // Logica di intercettazione nuovi membri (da inserire nel file principale o gestire qui)
            client.on('guildMemberAdd', async (member) => {
                
                // Creazione Embed Stile Rosso/Nero
                const verifyEmbed = new EmbedBuilder()
                    .setColor('#FF0000') // Rosso
                    .setTitle('𝖙𝖊𝖘𝖙 𝖉𝖎 𝖘𝖎𝖈𝖚𝖗𝖊𝖟𝖟𝖆') // Font Gothic/Bold
                    .setDescription('⚠️ **ATTENZIONE**\nClicca il bottone qui sotto per confermare di essere umano.\nHai **24 ore** di tempo, altrimenti verrai bannato permanentemente.')
                    .setThumbnail('https://i.imgur.com/89S9fS3.png') // Potresti mettere un'icona di un lucchetto
                    .setFooter({ text: 'Sistema di Sicurezza Integrato' });

                // Bottone Blu
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify_btn')
                        .setLabel('VERIFICA ACCOUNT')
                        .setStyle(ButtonStyle.Primary) // Blu
                );

                // Invia l'embed (effimero se fosse un comando slash, ma per i nuovi membri lo inviamo in un canale)
                const msg = await member.guild.channels.cache.get('ID_CANALE_VERIFICA').send({
                    content: `${member}`,
                    embeds: [verifyEmbed],
                    components: [row]
                });

                // Collettore per il bottone
                const collector = msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 86400000 // 24 ore in millisecondi
                });

                collector.on('collect', async (i) => {
                    if (i.user.id !== member.id) {
                        return i.reply({ content: "Non puoi farlo tu!", ephemeral: true });
                    }
                    
                    await i.reply({ content: "✅ Verifica completata! Benvenuto.", ephemeral: true });
                    await msg.delete(); // Rende il tutto "effimero" eliminando il messaggio
                    collector.stop('verified');
                });

                collector.on('end', async (collected, reason) => {
                    if (reason !== 'verified') {
                        // Se scade il tempo: BAN
                        await member.ban({ reason: 'Fallimento Test Anti-Bot (24h scadute)' });
                        
                        // Notifica in privato a te (Admin)
                        const admin = await client.users.fetch('IL_TUO_ID_ACCOUNT');
                        admin.send(`🚨 **LOG SICUREZZA:** L'utente **${member.user.tag}** è stato bannato per non aver completato la verifica.`);
                    }
                });
            });

        } else if (state === 'off') {
            message.channel.send("⚪ **Sistema Anti-Bot DISATTIVATO**");
            // Qui dovresti rimuovere il listener client.on
        } else {
            message.reply("Usa `.antibot on` oppure `.antibot off`.");
        }
    }
};
