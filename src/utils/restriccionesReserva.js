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
  investigador_visitante:  ["laboratorio", "despacho"],
  conserje:                [],
  gerente:                 [],
};

export function categoriasLibres(rol) {
  return CATEGORIAS_LIBRES[(rol || "").toLowerCase()] || [];
}

export function categoriasConRestriccionDepartamento(rol) {
  return CATEGORIAS_CON_RESTRICCION_DPTO[(rol || "").toLowerCase()] || [];
}

/**
 * Dado un espacio y el usuario autenticado, determina si el usuario
 * puede intentar reservarlo (feedback visual en el mapa).
 *
 * @param {{
 *   categoria: string,
 *   departamentoId: string|null,
 *   usuariosAsignados: Array<{id, nombre, rol}>,
 *   asignadoAEina: boolean
 * }} espacio
 * @param {{ rol: string, departamentoId: string|null, id: number }} usuario
 * @returns {{ puede: boolean, motivo: string|null }}
 */
export function puedeReservarEspacio(espacio, usuario) {
  if (!usuario?.rol) return { puede: false, motivo: "Sin rol asignado" };
  if (!espacio?.categoria) return { puede: false, motivo: "Sin categoría" };

  const rol       = usuario.rol.toLowerCase();
  const categoria = espacio.categoria.toLowerCase();

  if (rol === "gerente") return { puede: true, motivo: null };

  const libres  = categoriasLibres(rol);
  const conDpto = categoriasConRestriccionDepartamento(rol);

  if (libres.includes(categoria)) {
    return { puede: true, motivo: null };
  }

  if (conDpto.includes(categoria)) {
    const mismoDepto =
      usuario.departamentoId &&
      espacio.departamentoId &&
      String(usuario.departamentoId) === String(espacio.departamentoId);

    if (categoria === "despacho") {
      const usuariosAsignados = espacio.usuariosAsignados ?? [];
      const tieneUsuarios     = usuariosAsignados.length > 0;
      const hayVisitante      = usuariosAsignados.some((u) => u.rol === "investigador_visitante");

      // Investigador visitante — solo puede reservar si está asignado a él
      if (rol === "investigador_visitante") {
        const estaAsignado = usuariosAsignados.some((u) => String(u.id) === String(usuario.id));
        if (estaAsignado) return { puede: true, motivo: null };
        return { puede: false, motivo: "Este despacho no está asignado a ti" };
      }

      // O3: asignado a departamento (sin usuarios) — mismo departamento
      if (!tieneUsuarios && mismoDepto) return { puede: true, motivo: null };

      // O7: asignado a investigador visitante — mismo departamento
      if (tieneUsuarios && hayVisitante && mismoDepto) return { puede: true, motivo: null };

      // Asignado a persona que no es visitante — no reservable
      if (tieneUsuarios && !hayVisitante) {
        return { puede: false, motivo: "Este despacho está asignado a una persona y no es reservable" };
      }

      if (!mismoDepto) {
        return { puede: false, motivo: `Rol: ${usuario.rol} · Los despachos solo son reservables si son de tu departamento` };
      }
    }

    if (mismoDepto) return { puede: true, motivo: null };

    return {
      puede: false,
      motivo: `Rol: ${usuario.rol}${usuario.departamentoId ? ` · Solo puedes reservar ${categoria} de tu departamento` : ""}`,
    };
  }

  return {
    puede: false,
    motivo: `Rol: ${usuario.rol} · Puedes reservar: ${libres.join(", ")}${conDpto.length > 0 ? ` · Con restricción de dpto: ${conDpto.join(", ")}` : ""}`,
  };
}