const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "data.json");
//escribir fichero
// Función para leer el archivo y obtener los datos guardados
function readData() {
  if (!fs.existsSync(filePath)) {
    console.log("El archivo no existe. Creándolo...");
    const defaultData = { eventos: [], gachas: [] };
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
    return defaultData;
  }

  try {
    const fileData = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(fileData);

    // Si el archivo tiene un array vacío, lo corregimos
    if (!parsedData.eventos || !Array.isArray(parsedData.eventos)) {
      parsedData.eventos = [];
    }
    if (!parsedData.gachas || !Array.isArray(parsedData.gachas)) {
      parsedData.gachas = [];
    }

    return parsedData;
  } catch (error) {
    console.error("Error al leer el archivo:", error);
    return { eventos: [], gachas: [] };
  }
}

// Función para guardar los datos en el archivo
function saveData(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error al guardar los datos:", error);
  }
}

function comprobarMismoDato(array1, array2) {
  return JSON.stringify(array1) === JSON.stringify(array2);
}

//añadir a evento
function addEvent(event) {
  const data = readData();
  if (data.eventos.length > 0 && comprobarMismoDato(data.eventos[0], event)) {
    console.log("Datos duplicados, no guardamos");
    return;
  } else {
    console.log("Nuevo evento detectado! Escribiendo...");
    data.eventos = [event];
    saveData(data);
  }
}

//añadir a gacha
function addGacha(gacha) {
  const data = readData();
  if (data.gachas.length > 0 && comprobarMismoDato(data.gachas[0], gacha)) {
    console.log("Datos duplicados, no guardamos");
    return;
  } else {
    console.log("Nuevo gacha detectado! Escribiendo...");
    data.gachas = [gacha];
    //data.gachas.unshift(gacha);
    saveData(data);
  }
}

function normalizeData(data) {
  return {
    eventos: data.eventos.map((e) => [
      {
        title: e.embeds?.[0]?.title || "",
        image: e.embeds?.[1]?.image?.url || "",
        link: "https://mahoyaku.fandom.com/wiki/Promise_of_Wizard_Wiki",
      },
    ]),
    gachas: data.gachas.map((g) =>
      g.embeds
        ? g.embeds
            .filter((embed) => embed.title && embed.image)
            .map((embed) => ({
              wiwi: embed.title,
              imageWiwi: embed.image.url,
            }))
        : []
    ),
  };
}
module.exports = {
  readData,
  saveData,
  addEvent,
  addGacha,
  comprobarMismoDato,
  normalizeData,
};
