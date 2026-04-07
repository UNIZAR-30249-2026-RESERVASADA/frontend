const CATEGORIAS_LIBRES = {
  estudiante:              ["sala comun"],
  investigador_contratado: ["aula", "seminario", "sala comun"],
  docente_investigador:    ["aula", "seminario", "sala comun"],
  tecnico_laboratorio:     ["seminario", "sala comun"],
  conserje:                ["aula", "seminario", "sala comun"],
  investigador_visitante:  ["aula", "seminario", "sala comun"],
  gerente:                 ["aula", "seminario", "sala comun", "laboratorio", "despacho"],
};

const CATEGORIAS_CON_RESTRICCION_DPTO = {
  estudiante:              [],
  investigador_contratado: ["laboratorio", "despacho"],
  docente_investigador:    ["laboratorio", "despacho"],
  tecnico_laboratorio:     ["laboratorio"],
  investigador_visitante:  ["laboratorio"],
  conserje:                [],
  gerente:                 [],
};

/**
 * Devuelve las categorías que el rol puede reservar sin restricción de departamento.
 * @param {string} rol
 * @returns {string[]}
 */
export function categoriasLibres(rol) {
  return CATEGORIAS_LIBRES[(rol || "").toLowerCase()] || [];
}

/**
 * Devuelve las categorías que requieren coincidir en departamento.
 * @param {string} rol
 * @returns {string[]}
 */
export function categoriasConRestriccionDepartamento(rol) {
  return CATEGORIAS_CON_RESTRICCION_DPTO[(rol || "").toLowerCase()] || [];
}

/**
 * Dado un espacio y el usuario autenticado, determina si el usuario
 * puede intentar reservarlo (feedback visual en el mapa).
 * La validación real la hace el backend — esto es solo para la UI.
 *
 * @param {{ categoria: string, departamentoId: string|null }} espacio
 * @param {{ rol: string, departamentoId: string|null }} usuario
 * @returns {{ puede: boolean, motivo: string|null }}
 */
export function puedeReservarEspacio(espacio, usuario) {
  if (!usuario?.rol) return { puede: false, motivo: "Sin rol asignado" };
  if (!espacio?.categoria) return { puede: false, motivo: "Sin categoría" };

  const rol       = usuario.rol.toLowerCase();
  const categoria = espacio.categoria.toLowerCase();

  if (rol === "gerente") return { puede: true, motivo: null };

  const libres      = categoriasLibres(rol);
  const conDpto     = categoriasConRestriccionDepartamento(rol);

  if (libres.includes(categoria)) {
    return { puede: true, motivo: null };
  }

  if (conDpto.includes(categoria)) {
    const mismoDepto =
      usuario.departamentoId &&
      espacio.departamentoId &&
      String(usuario.departamentoId) === String(espacio.departamentoId);

    if (mismoDepto) return { puede: true, motivo: null };
    return { puede: false, motivo: "Solo disponible para tu departamento" };
  }

  return { puede: false, motivo: `Tu rol no puede reservar ${categoria}` };
}