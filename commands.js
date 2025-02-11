const axios = require("axios");
const cheerio = require("cheerio");
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
};

const funcionesComunes = require("./funcionescomunes.js");

// Ruta del archivo donde se almacenarán los datos

module.exports = {
  ping: {
    name: "ping",
    description: "test",
    execute: async (interaction) => {
      await interaction.reply("¡Pong! 🏓").catch(console.error);
    },
  },
  event: {
    name: "event",
    description: "Obten info del evento manualmente",
    execute: async (interaction) => {
      const url = "https://mahoyaku.fandom.com/wiki/Promise_of_Wizard_Wiki";
      try {
        // Realizamos la petición HTTP con Axios
        await interaction.deferReply();

        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);

        const result = [];
        const gachaResult = [];

        let found = false;

        // Localizar el <th> que contiene el texto "✦⁺₊ Current Events & Banner" en la tabla con la clase "front-table"
        $("table.front-table").each((index, table) => {
          // Buscar el th dentro de la tabla que contiene el texto exacto
          const th = $(table)
            .find("th")
            .filter((i, el) =>
              $(el).text().includes("✦⁺₊ Current Events & Banner")
            );

          if (th.length > 0) {
            // Una vez encontrado el <th>, buscar el <div> con las imágenes dentro del <td> correspondiente
            const div = $(th)
              .closest("table")
              .find("td")
              .find(
                'div[style="display: flex;gap: 1em; flex-wrap: wrap; width: 100%; box-sizing: border-box; justify-content: center; padding-bottom:1em;"]'
              );

            // Extraer las imágenes dentro del div
            div.find("img").each((i, imgElement) => {
              // Ahora verificamos primero el atributo 'data-src', y si no existe, tomamos 'src'
              found = true;
              let imgUrl =
                $(imgElement).attr("data-src") || $(imgElement).attr("src");
              const imgLink = $(imgElement).closest("a").attr("href"); // Obtener el enlace que precede a la imagen
              const nombreImg = $(imgElement).attr("data-image-name");
              const nombreImgSinBanner = nombreImg
                ? nombreImg.replace(/\s*Banner\.png$/, "")
                : "Titulo no encontrado xDXD?";
              const esGacha = /Gacha/i.test(nombreImgSinBanner);
              if (imgUrl && imgLink) {
                // Asegurarse de que la URL de la imagen es válida y completa
                imgUrl = imgUrl.startsWith("http") ? imgUrl : `https:${imgUrl}`;

                // Corregir el enlace relativo con la URL base
                const fullLink = imgLink.startsWith("http")
                  ? imgLink
                  : `https://mahoyaku.fandom.com${imgLink}`;
                result.push({
                  image: imgUrl,
                  link: fullLink,
                  title: nombreImgSinBanner,
                  gacha: esGacha,
                });
              }
            });

            if (!found) {
              const noUrls = $(th)
                .closest("table")
                .find("td")
                .find(
                  'div[style="font-size:140%;width:100%;text-align:center;padding:0.6em;text-shadow: 0 0 8px #D2C9F2;"]'
                );
              const nombreBanner =
                noUrls.find("b").text() || "No hay eventos o la wiki no va XD";
              result.push({
                image:
                  "https://static.wikia.nocookie.net/mahoyaku/images/e/e6/Site-logo.png/revision/latest/scale-to-width-down/400?cb=20210710070410",
                link: "https://mahoyaku.fandom.com/wiki/Promise_of_Wizard_Wiki",
                title: nombreBanner,
              });
            }

            const div2 = $(th)
              .closest("table")
              .find("td")
              .find('div[style="text-align: center;"]');
            //extraccion de wiwis
            div2.find("img").each((i, imgElement) => {
              // Ahora verificamos primero el atributo 'data-src', y si no existe, tomamos 'src'
              let imgUrl =
                $(imgElement).attr("data-src") || $(imgElement).attr("src");
              const imgLink = $(imgElement).closest("a").attr("href"); // Obtener el enlace que precede a la imagen
              const nombreWiwi = $(imgElement).attr("data-image-name");
              const nombreWiwiCortado = nombreWiwi
                ? nombreWiwi.replace(/^Mini\s+/i, "").replace(/\.png$/i, "")
                : "Wiwi no encontrado xDXD?";
              //console.log(nombreWiwi, '', nombreWiwiCortado, '', imgLink);
              if (imgUrl && imgLink) {
                // Asegurarse de que la URL de la imagen es válida y completa
                imgUrl = imgUrl.startsWith("http") ? imgUrl : `https:${imgUrl}`;

                // Corregir el enlace relativo con la URL base
                const fullLink = imgLink.startsWith("http")
                  ? imgLink
                  : `https://mahoyaku.fandom.com${imgLink}`;

                gachaResult.push({
                  imageWiwi: imgUrl,
                  wiwi: nombreWiwiCortado,
                });
              }
            });
          }
        });

        // Crear un embed por cada evento
        const embeds = [
          {
            color: 0x0099ff,
            title: "Eventos actuales Mahoyaku",
            description: "Oh gran sabio, estas son las últimas noticias:",
          },
        ];

        if (result.length > 0 && found) {
          funcionesComunes.addEvent(result);
          result.forEach((item) => {
            if (item.gacha === false) {
              embeds.push({
                color: 0x0099ff,
                title: item.title,
                image: { url: item.image },
                description: `[Pulsa aquí para más información](${item.link})`,
              });
            } else {
              embeds.push({
                color: 0xff0099,
                title: item.title,
                image: { url: item.image },
                description: `[Pulsa aquí para más información](${item.link})`,
              });
            }
          });
          await interaction.editReply({ embeds });
        } else {
          // await interaction.editReply("Sin fotos");

          if (result.length > 0) {
            funcionesComunes.addEvent(result);
            result.forEach((item) => {
              embeds.push({
                color: 0x999999,
                title: item.title,
                image: { url: item.image },
                description: "Aún no han subido links y fotos a la wiki",
              });
            });
            await interaction.editReply({ embeds });
          }
        }
        if (gachaResult.length > 0) {
          funcionesComunes.addGacha(gachaResult);
          embeds.push({
            color: 0xff0099,
            title: "Estos son los SSR",
          });
          gachaResult.forEach((item) => {
            embeds.push({
              color: 0xff0099,
              title: item.wiwi,
              image: { url: item.imageWiwi },
            });
          });
        }
        await interaction.editReply({ embeds });
        // Embed de pie de página (opcional)
        embeds.push({
          color: 0x0099ff,
          footer: { text: "Extraído de la Wiki de Mahoyaku" },
        });
        await interaction.editReply({ embeds });
      } catch (error) {
        console.error("Error al obtener fotos y enlaces:", error);
        await interaction.reply(
          "Hubo un error al obtener las imágenes y enlaces."
        );
      }
    },
  },
};
