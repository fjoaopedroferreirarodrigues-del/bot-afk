
require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Events
} = require('discord.js');

const {
  joinVoiceChannel,
  VoiceConnectionStatus
} = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once(Events.ClientReady, async () => {
  console.log(`Bot online: ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channel = await guild.channels.fetch(process.env.AFK_CHANNEL_ID);

  if (!channel || !channel.isVoiceBased()) {
    console.log('ID da call AFK inválido!');
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log('Conexão perdida. Tentando reconectar...');
    setTimeout(() => {
      try {
        connection.rejoin();
      } catch (error) {
        console.log('Reinicie o bot se não reconectar.');
      }
    }, 5000);
  });

  console.log(`Conectado à call AFK: ${channel.name}`);
});

client.login(process.env.DISCORD_TOKEN);
