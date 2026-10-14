
require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes
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

const comandoEmbed = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Cria uma embed personalizada')
  .addStringOption(option =>
    option.setName('titulo')
      .setDescription('Título da embed')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('descricao')
      .setDescription('Texto da embed')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('cor')
      .setDescription('Cor hexadecimal, exemplo: #8B5CF6')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('imagem')
      .setDescription('URL da imagem (opcional)')
      .setRequired(false));

client.once(Events.ClientReady, async () => {
  console.log(`Bot online: ${client.user.tag}`);

  try {
    const rest = new REST({ version: '10' })
      .setToken(process.env.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(
        client.user.id,
        process.env.GUILD_ID
      ),
      { body: [comandoEmbed.toJSON()] }
    );

    console.log('Comando /embed registrado!');
  } catch (error) {
    console.error('Erro ao registrar /embed:', error);
  }

  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = await guild.channels.fetch(
      process.env.AFK_CHANNEL_ID
    );

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
  } catch (error) {
    console.error('Erro na conexão AFK:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'embed') return;

  const titulo = interaction.options.getString('titulo');
  const descricao = interaction.options.getString('descricao');
  const corInformada = interaction.options.getString('cor');
  const imagem = interaction.options.getString('imagem');

  let cor = '#8B5CF6';

  if (corInformada) {
    if (!/^#?[0-9a-fA-F]{6}$/.test(corInformada)) {
      return interaction.reply({
        content: 'A cor precisa ser hexadecimal, como #FF0000.',
        ephemeral: true
      });
    }

    cor = corInformada.startsWith('#')
      ? corInformada
      : `#${corInformada}`;
  }

  const embed = new EmbedBuilder()
    .setTitle(titulo)
    .setDescription(descricao)
    .setColor(cor)
    .setFooter({ text: 'Dark Store' })
    .setTimestamp();

  if (imagem) {
    try {
      const url = new URL(imagem);

      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('URL inválida');
      }

      embed.setImage(url.toString());
    } catch {
      return interaction.reply({
        content: 'A imagem precisa ter uma URL válida começando com https:// ou http://.',
        ephemeral: true
      });
    }
  }

  await interaction.reply({
    embeds: [embed]
  });
});

client.login(process.env.DISCORD_TOKEN);
