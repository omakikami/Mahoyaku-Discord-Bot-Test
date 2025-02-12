require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  normalizeArray,
} = require("discord.js");

// Importar los comandos desde commands.js
const commands = require("./commands");
const funcionesComunes = require("./funcionescomunes.js");
const cron = require("node-cron");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CLIENT_ID = process.env.CLIENT_ID; // Asegúrate de usar el CLIENT_ID
//const GUILD_ID = process.env.GUILD_ID; // El ID del servidor donde quieres registrar los comandos
const token = process.env.DISCORD_TOKEN;

// Registrar los comandos en Discord
const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Registrando comandos...");

    // Mapear los comandos para registrar solo name y description
    const commandsToRegister = Object.values(commands).map((command) => ({
      name: command.name,
      description: command.description,
    }));

    console.log(commandsToRegister); // Para depuración, puedes verificar qué comandos estás enviando

    // Registrar comandos en el servidor específico (guild)
    await rest.put(
      /*applicationCommands para global, applicationGuildCommands para local */
      Routes.applicationCommands(CLIENT_ID), // Usar applicationGuildCommands con GUILD_ID
      { body: commandsToRegister }
    );
    console.log("Comandos registrados con éxito.");
  } catch (error) {
    console.error("Error al registrar comandos:", error);
  }
})();

// Evento cuando el bot está listo
client.once("ready", async () => {
  console.log(`Bot conectado como ${client.user.tag}`);

  // Obtén la lista de servidores en los que el bot está presente
  const guilds = client.guilds.cache;

  // console.log(
  //   "Eliminando comandos existentes en todos los servidores...",
  //   JSON.stringify(guilds)
  // );

  // // Itera sobre todos los servidores y elimina los comandos
  // for (const guild of guilds.values()) {
  //   try {
  //     console.log(
  //       `Eliminando comandos en el servidor: ${guild.name} (${guild.id})`
  //     );

  //     // Elimina los comandos de cada servidor
  //     await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), {
  //       body: [],
  //     });

  //     console.log(`Comandos eliminados en el servidor: ${guild.name}`);
  //   } catch (error) {
  //     console.error(
  //       `Error al eliminar comandos en el servidor ${guild.name}:`,
  //       error
  //     );
  //   }
  // }
  client.user.setActivity("hecho por el Omakis", { type: "PLAYING" });
});

// Evento para manejar interacciones
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands[interaction.commandName];
  if (command) {
    await command.execute(interaction);
  }
});

cron.schedule("0 */6 * * *", async () => {
  console.log(
    "Ejecutando comprobación de eventos automáticamente en todos los servidores..."
  );

  client.guilds.cache.forEach(async (guild) => {
    try {
      const channel = guild.channels.cache.find(
        (ch) => ch.isTextBased() && ch.name === "la-promesa-de-los-magos"
      );
      if (!channel) {
        console.log(
          `No se encontró el canal "la-promesa-de-los-magos" en ${guild.name}`
        );
        return;
      }
      console.log(`Procesando evento en ${guild.name} (${channel.name})`);

      let previousData = funcionesComunes.readData();
      // console.log("previousData:", JSON.stringify(previousData));

      let respuesta = { eventos: [], gachas: [] };

      const fakeInteraction = {
        channel: channel,
        reply: async (msg) => {
          respuesta.eventos = [{ text: msg }]; // Sobrescribe en lugar de acumular
        },
        deferReply: async () => {},
        editReply: async (msg) => {
          respuesta.eventos = [{ text: msg }]; // Mantén solo la última versión
        },
      };
      //console.log("respuesta:", JSON.stringify(respuesta));

      // Ejecuta el comando (que internamente debe llamar a funcionesComunes.addEvent y addGacha)
      await commands.event.execute(fakeInteraction);

      //  Leer los nuevos datos del fichero
      let newData = funcionesComunes.readData();
      //console.log("newData:", JSON.stringify(newData));

      // Comparar los datos (suponemos que tus funciones de comparación o normalización ya están implementadas)
      if (JSON.stringify(previousData) !== JSON.stringify(newData)) {
        console.log("Se detectaron cambios, enviando actualización...");

        await channel.send("Se han actualizado los datos del evento.");
        console.log("respuesta:", JSON.stringify(respuesta));

        // Eliminar duplicados en respuesta.eventos
        const eventosUnicos = respuesta.eventos.filter(
          (evento, index, self) =>
            index ===
            self.findIndex((e) => JSON.stringify(e) === JSON.stringify(evento))
        );

        // const gachaUnico = respuesta.gachas.filter(
        //   (gacha, index, self) =>
        //     index ===
        //     self.findIndex((e) => JSON.stringify(e) === JSON.stringify(gacha))
        // );

        // Enviar los mensajes únicos
        for (const [i, evento] of eventosUnicos.entries()) {
          await channel.send(evento.text);
          console.log("ejecutando bucle evento:", i + 1, "veces");
        }

        // for (const [j, gacha] of eventosUnicos.entries()) {
        //   await channel.send(gacha.text);
        //   console.log("ejecutando bucle gacha:", j + 1, "veces");
        // }
      } else {
        console.log("No hay cambios, no se envía nada.");
      }
    } catch (error) {
      console.error(`Error en el servidor ${guild.name}:`, error);
    }
  });
});

// Iniciar sesión
client.login(token);
