/**
 * Utilidades de texto compartidas por las pantallas del taller.
 */

/**
 * Corrige caracteres heredados de una codificación incorrecta (mojibake) antes
 * de mostrar datos guardados en la base. No altera textos ya correctos.
 */
export function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return "";

  const mapa = {
    "Ã¡": "á",
    "Ã©": "é",
    "Ã­": "í",
    "Ã³": "ó",
    Ãº: "ú",
    "Ã±": "ñ",
    "Ã¼": "ü",
    Ã: "Á",
    "Ã‰": "É",
    Ã: "Í",
    'Ã"': "Ó",
    Ãš: "Ú",
    "Ã‘": "Ñ",
    Ãœ: "Ü",
    Â: "A",
    "?r": "ér",
    "?s": "és",
    "?n": "én",
    "?l": "él",
    "?m": "ém",
    "?t": "ét",
    "?d": "éd",
    "?b": "éb",
    "?p": "ép",
    "?c": "éc",
    "?v": "év",
    "?g": "ég",
    "?j": "éj",
    "?z": "ez",
  };

  let texto = String(valor);
  Object.entries(mapa).forEach(([entrada, salida]) => {
    texto = texto.split(entrada).join(salida);
  });

  return texto;
}
