/**
 * Devuelve el color hexadecimal correspondiente a una categoría de espacio.
 * @param {string} categoria
 * @returns {string} color hex
 */
export function colorPorCategoria(categoria) {
  const valor = (categoria || "").toLowerCase();

  if (
    valor.includes("laboratorio") ||
    valor.includes("lab") ||
    valor.includes("informática") ||
    valor.includes("informatica") ||
    valor.includes("sala informatica")
  ) return "#3b82f6";

  if (valor.includes("despacho"))                          return "#ef4444";
  if (valor.includes("seminario"))                         return "#facc15";
  if (valor.includes("aula"))                              return "#f59e0b";
  if (valor.includes("común") || valor.includes("comun")) return "#22c55e";
  if (valor.includes("pasillo"))                           return "#8b5cf6";

  return "#9ca3af";
}

/**
 * Devuelve color de fondo y de texto para usar en iconos/badges.
 * @param {string} categoria
 * @returns {{ bg: string, text: string }}
 */
export function colorIconPorCategoria(categoria) {
  const hex = colorPorCategoria(categoria);
  return {
    bg:   `${hex}1a`,
    text: hex,
  };
}