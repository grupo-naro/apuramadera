/**
 * Generación de CSV (RFC 4180).
 *
 * Escapa celdas con comas, comillas o saltos de línea, y usa
 * `\r\n` como fin de línea. Para que Excel detecte UTF-8 conviene
 * anteponer un BOM (`﻿`) al escribir el archivo.
 */

/** Escapa una celda: la entrecomilla si contiene caracteres conflictivos. */
function escapeCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Arma un CSV a partir de los encabezados y las filas. */
export function buildCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows]
    .map((cells) => cells.map(escapeCell).join(","))
    .join("\r\n");
}
