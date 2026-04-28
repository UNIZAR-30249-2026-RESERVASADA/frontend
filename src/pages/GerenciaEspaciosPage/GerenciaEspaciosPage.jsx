import { useState, useEffect, useMemo } from "react";
import {
  FiSearch, FiEdit2, FiCheck, FiX, FiMapPin, FiUsers, FiInfo,
  FiShield, FiGrid, FiBookOpen, FiHome, FiRefreshCw, FiLayers,
  FiCheckCircle, FiSliders, FiClock, FiAlertCircle
} from "react-icons/fi";
import { MdMeetingRoom, MdScience, MdOutlineOtherHouses } from "react-icons/md";
import { obtenerMetadatosEspacios, modificarEspacio, modificarEdificio } from "../../services/espaciosBackendService";
import { colorIconPorCategoria } from "../../utils/coloresEspacio";
import Header from "../../components/Header";
import "./GerenciaEspaciosPage.css";

const DEPARTAMENTOS = {
  1: "Informática e Ingeniería de Sistemas",
  2: "Ingeniería Electrónica y Comunicaciones",
};

const CATEGORIAS_EDITABLES = ["aula", "seminario", "laboratorio", "despacho", "sala comun"];

const BADGE_CFG = {
  aula:        { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", label: "Aula" },
  seminario:   { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", label: "Seminario" },
  laboratorio: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe", label: "Laboratorio" },
  despacho:    { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", label: "Despacho" },
  "sala comun":{ bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4", label: "Sala común" },
  pasillo:     { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff", label: "Pasillo" },
  otros:       { bg: "#f9fafb", text: "#374151", border: "#e5e7eb", label: "Otros" },
};

function normalizarUsoFisico(uso) {
  const u = (uso || "").toLowerCase().trim();
  if (u.includes("laboratorio") || u.includes("lab") || u.includes("sala inform") || u.includes("informatica") || u.includes("informática")) return "laboratorio";
  if (u.includes("aula"))      return "aula";
  if (u.includes("seminario")) return "seminario";
  if (u.includes("despacho"))  return "despacho";
  if (u.includes("comun") || u.includes("común")) return "sala comun";
  return null;
}

const TRANSICIONES_POR_USO = {
  aula:        ["aula", "seminario", "sala comun"],
  laboratorio: ["laboratorio", "aula", "seminario"],
  seminario:   ["seminario", "aula", "sala comun"],
  despacho:    ["despacho"],
  "sala comun":["sala comun", "aula", "seminario"],
};

function categoriasDisponibles(uso, categoriaActual) {
  const usoNorm = normalizarUsoFisico(uso);
  const permitidas = usoNorm ? TRANSICIONES_POR_USO[usoNorm] : null;
  if (permitidas) return permitidas;
  const actual = (categoriaActual || "").toLowerCase();
  return CATEGORIAS_EDITABLES.includes(actual) ? [actual] : CATEGORIAS_EDITABLES;
}

function opcionesAsignacion(categoria) {
  const c = (categoria || "").toLowerCase();
  if (c === "aula" || c === "sala comun") return ["eina"];
  if (c === "despacho") return ["departamento", "persona"];
  return ["eina", "departamento"];
}

function textoAsignacion(espacio) {
  if (espacio.asignadoAEina) return { tipo: "eina" };
  if (espacio.departamentoId) return { tipo: "departamento", id: espacio.departamentoId };
  if ((espacio.usuariosAsignados || []).length > 0) return { tipo: "persona", usuarios: espacio.usuariosAsignados };
  return { tipo: "ninguna" };
}

function NombreCategoria(cat) {
  return BADGE_CFG[(cat||"").toLowerCase()]?.label || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "N/D");
}

export default function GerenciaEspaciosPage() {
  const [espacios,     setEspacios]     = useState([]);
  const [usuarios,     setUsuarios]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [busqueda,     setBusqueda]     = useState("");
  const [filtroTipo,   setFiltroTipo]   = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [editando,     setEditando]     = useState(null);
  const [guardando,    setGuardando]    = useState(false);
  const [form,         setForm]         = useState({});
  const [errForm,      setErrForm]      = useState("");
  const [formEdificio, setFormEdificio] = useState(null);  // null = cerrado
  const [guardandoEdificio, setGuardandoEdificio] = useState(false);
  const [errEdificio,  setErrEdificio]  = useState("");
  const [afectarTodos, setAfectarTodos] = useState(false);
  const [errHorario,   setErrHorario]   = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setLoading(true);
      const data = await obtenerMetadatosEspacios();
      setEspacios(data);
      const mapa = {};
      for (const e of data) for (const u of e.usuariosAsignados || []) if (u.id) mapa[u.id] = u;
      setUsuarios(Object.values(mapa));
    } catch (err) {
      setError(err.message || "Error cargando espacios");
    } finally {
      setLoading(false);
    }
  }

  const espaciosFiltrados = useMemo(() => espacios.filter((e) => {
    const t = busqueda.toLowerCase();
    if (t && !e.nombre?.toLowerCase().includes(t) && !e.id_espacio?.toLowerCase().includes(t)) return false;
    if (filtroTipo !== "todos" && (e.categoria||"").toLowerCase() !== filtroTipo) return false;
    if (filtroEstado === "reservable"    && !e.reservable) return false;
    if (filtroEstado === "no_reservable" &&  e.reservable) return false;
    return true;
  }), [espacios, busqueda, filtroTipo, filtroEstado]);

  const stats = useMemo(() => {
    const s = { total: espacios.length, reservables: espacios.filter(e => e.reservable).length };
    for (const c of CATEGORIAS_EDITABLES) s[c] = espacios.filter(e => (e.categoria||"").toLowerCase() === c).length;
    return s;
  }, [espacios]);

  function abrirEdificio() {
    const e = espacios[0] || {};
    setFormEdificio({
      id:                  1, // Ada Byron siempre es id=1
      nombre:              e.edificioNombre              || "Ada Byron",
      porcentajeOcupacion: e.edificioPorcentaje          ?? 100,
    });
    setErrEdificio("");
    setAfectarTodos(false);
  }

  async function guardarEdificio() {
    setErrEdificio("");
    const cambios = {};
    const e = espacios[0] || {};

    // Si afectarTodos, mandar siempre el porcentaje aunque no haya cambiado
    // para que los espacios con % propio vuelvan a heredar el del edificio
    if (afectarTodos || Number(formEdificio.porcentajeOcupacion) !== (e.edificioPorcentaje ?? 100)) {
      cambios.porcentajeOcupacion = Number(formEdificio.porcentajeOcupacion);
    }
    if (!Object.keys(cambios).length) { setFormEdificio(null); return; }

    setGuardandoEdificio(true);
    try {
      const res = await modificarEdificio(formEdificio.id, cambios, afectarTodos);

      await cargar();
      setFormEdificio(null);
    } catch (err) {
      setErrEdificio(err.message || "Error guardando");
    } finally {
      setGuardandoEdificio(false);
    }
  }

  function abrirEdicion(espacio) {
    const asig = textoAsignacion(espacio);
    const opciones = opcionesAsignacion(espacio.categoria);
    const tipoInicial = opciones.includes(asig.tipo) ? asig.tipo : opciones[0];
    setEditando(espacio.gid);
    setErrForm("");
    setErrHorario("");
    setForm({
      reservable:     espacio.reservable ?? false,
      categoria:      (espacio.categoria||"").toLowerCase(),
      usoFisico:      (espacio.uso||"").toLowerCase(),

      tipoAsignacion: tipoInicial,
      departamentoId: espacio.departamentoId ? String(espacio.departamentoId) : "",
      usuariosIds:    (espacio.usuariosAsignados||[]).map(u => String(u.id)),
      horarioApertura:     espacio.horarioApertura     ?? null,
      horarioCierre:       espacio.horarioCierre       ?? null,
      porcentajeOcupacion: espacio.porcentajeOcupacion ?? "",
    });
  }

  function cambiarCategoria(cat) {
    const opciones = opcionesAsignacion(cat);
    const tipo = opciones.includes(form.tipoAsignacion) ? form.tipoAsignacion : opciones[0];
    setForm(f => ({ ...f, categoria: cat, tipoAsignacion: tipo }));
  }

  function toggleUsuario(uid) {
    setForm(f => ({
      ...f,
      usuariosIds: f.usuariosIds.includes(uid)
        ? f.usuariosIds.filter(id => id !== uid)
        : [...f.usuariosIds, uid]
    }));
  }

  async function guardarEdicion(espacio) {
    setErrForm("");
    const cambios = {};
    if (form.reservable !== espacio.reservable) cambios.reservable = form.reservable;
    if (form.categoria !== (espacio.categoria||"").toLowerCase()) cambios.categoria = form.categoria;


    let newEina = false, newDpto = null, newUsers = [];
    if (form.tipoAsignacion === "eina") { newEina = true; }
    else if (form.tipoAsignacion === "departamento") {
      if (!form.departamentoId) { setErrForm("Selecciona un departamento"); return; }
      newDpto = Number(form.departamentoId);
    } else {
      if (!form.usuariosIds.length) { setErrForm("Selecciona al menos un usuario"); return; }
      newUsers = form.usuariosIds.map(Number);
    }

    const asigCambiada = newEina !== espacio.asignadoAEina || newDpto !== espacio.departamentoId ||
      JSON.stringify(newUsers) !== JSON.stringify((espacio.usuariosAsignados||[]).map(u=>u.id));
    if (asigCambiada) {
      cambios.asignadoAEina = newEina;
      cambios.departamentoId = newDpto;
      cambios.usuariosAsignados = newUsers;
    }

    const pctActual = espacio.porcentajeOcupacion ?? null;
    const pctNuevo  = form.porcentajeOcupacion !== "" ? Number(form.porcentajeOcupacion) : null;
    if (pctNuevo !== pctActual) cambios.porcentajeOcupacion = pctNuevo;

    const aperturaCambiada = form.horarioApertura !== (espacio.horarioApertura ?? null);
    const cierreCambiado   = form.horarioCierre   !== (espacio.horarioCierre   ?? null);

    // Si se cambia uno hay que cambiar los dos
    if (aperturaCambiada && !form.horarioCierre) {
      setErrHorario("Debes indicar también la hora de cierre");
      return;
    }
    if (cierreCambiado && !form.horarioApertura) {
      setErrHorario("Debes indicar también la hora de apertura");
      return;
    }
    setErrHorario("");
    if (aperturaCambiada || cierreCambiado) {
      cambios.horarioApertura = form.horarioApertura || null;
      cambios.horarioCierre   = form.horarioCierre   || null;
    }

    if (!Object.keys(cambios).length) { setEditando(null); return; }
    setGuardando(true);
    try {
      await modificarEspacio(espacio.gid, cambios);
      await cargar();
      setEditando(null);
    } catch (err) {
      setErrForm(err.message || "Error guardando cambios");
    } finally {
      setGuardando(false);
    }
  }

  const STAT_ITEMS = [
    { label: "Total espacios",  key: "total",       icon: <FiLayers size={18} />,       accent: "#4b5563", bg: "#f9fafb" },
    { label: "Reservables",     key: "reservables", icon: <FiCheckCircle size={18} />,  accent: "#15803d", bg: "#f0fdf4" },
    { label: "Aulas",           key: "aula",        icon: <FiBookOpen size={18} />,     accent: "#c2410c", bg: "#fff7ed" },
    { label: "Seminarios",      key: "seminario",   icon: <MdMeetingRoom size={18} />,  accent: "#1d4ed8", bg: "#eff6ff" },
    { label: "Laboratorios",    key: "laboratorio", icon: <MdScience size={18} />,      accent: "#6d28d9", bg: "#f5f3ff" },
    { label: "Despachos",       key: "despacho",    icon: <FiHome size={18} />,         accent: "#15803d", bg: "#f0fdf4" },
    { label: "Salas comunes",   key: "sala comun",  icon: <FiUsers size={18} />,        accent: "#0f766e", bg: "#f0fdfa" },
  ];

  return (
    <div className="gespace-root">
      <Header backLink={{ label: "← Volver al mapa", to: "/" }} />
      <main className="gespace-main">

        {/* Cabecera */}
        <div className="gespace-header">
          <div className="gespace-header-text">
            <div className="gespace-header-icon"><FiSliders size={20} /></div>
            <div>
              <h2 className="gespace-title">Gestión de espacios</h2>
              <p className="gespace-subtitle">Administra categorías, reservabilidad y asignaciones</p>
            </div>
          </div>
          <button className="gespace-refresh" onClick={cargar} disabled={loading}>
            <FiRefreshCw size={13} className={loading ? "gespace-spin" : ""} />
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        <div style={{ height: 20 }} />

        {/* Panel edificio */}
        {!loading && !error && (
          <div className="gespace-edificio-panel" style={{ marginBottom: 20 }}>
            <div className="gespace-edificio-header">
              <div className="gespace-edificio-title-wrap">
                <FiHome size={16} style={{ color: "#6b7280" }} />
                <div>
                  <span className="gespace-edificio-title">Edificio {espacios[0]?.edificioNombre || "Ada Byron"}</span>
                  <span className="gespace-edificio-subtitle">
                    Horario: {espacios[0]?.edificioHorarioApertura || "—"} – {espacios[0]?.edificioHorarioCierre || "—"} ·
                    Ocupación máx.: {espacios[0]?.edificioPorcentaje ?? 100}%
                  </span>
                </div>
              </div>
              {!formEdificio ? (
                <button className="gespace-btn-edit" onClick={abrirEdificio} title="Editar % ocupación del edificio">
                  <FiEdit2 size={13} />
                </button>
              ) : (
                <div className="gespace-actions">
                  <button className="gespace-btn-save" onClick={guardarEdificio} disabled={guardandoEdificio}>
                    {guardandoEdificio ? <FiRefreshCw size={12} className="gespace-spin" /> : <FiCheck size={12} />}
                  </button>
                  <button className="gespace-btn-cancel" onClick={() => setFormEdificio(null)}>
                    <FiX size={12} />
                  </button>
                </div>
              )}
            </div>

            {formEdificio && (
              <div className="gespace-edificio-form">
                <div className="gespace-edificio-row">
                  <div className="gespace-edificio-field">
                    <label className="gespace-edificio-label">% Ocupación máx. del edificio</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number" min={0} max={100}
                        className="gespace-field gespace-field--num"
                        value={formEdificio.porcentajeOcupacion}
                        onChange={ev => setFormEdificio(f => ({ ...f, porcentajeOcupacion: ev.target.value }))}
                      />
                      <span style={{ fontSize: 12, color: "#6b7280" }}>%</span>
                    </div>
                  </div>
                </div>

                <label className="gespace-edificio-check">
                  <input
                    type="checkbox"
                    checked={afectarTodos}
                    onChange={ev => setAfectarTodos(ev.target.checked)}
                  />
                  <span>Aplicar a <strong>todos</strong> los espacios (incluidos los que tienen % propio)</span>
                </label>

                {!afectarTodos && (
                  <p className="gespace-edificio-hint">
                    <FiInfo size={12} /> Solo afectará a espacios sin porcentaje propio. Los que tienen uno propio lo mantendrán. Las reservas que superen el nuevo límite serán canceladas si quedan más de 24h.
                  </p>
                )}
                {afectarTodos && (
                  <p className="gespace-edificio-hint gespace-edificio-hint--danger">
                    <FiAlertCircle size={12} /> Se aplicará a <strong>todos</strong> los espacios ignorando sus % propios. Las reservas que superen el nuevo límite serán canceladas si quedan más de 24h.
                  </p>
                )}

                {errEdificio && <p className="gespace-err"><FiX size={11} /> {errEdificio}</p>}
              </div>
            )}
          </div>
        )}


        {/* Stats */}
        <div className="gespace-stats">
          {STAT_ITEMS.map(({ label, key, icon, accent, bg }) => (
            <div key={key} className="gespace-stat-card" style={{ borderTop: `3px solid ${accent}` }}>
              <div className="gespace-stat-icon-wrap" style={{ background: bg, color: accent }}>
                {icon}
              </div>
              <div className="gespace-stat-body">
                <span className="gespace-stat-num" style={{ color: accent }}>{stats[key] ?? 0}</span>
                <span className="gespace-stat-label">{label}</span>
              </div>
            </div>
          ))}
        </div>


        {/* Filtros */}
        <div className="gespace-filtros">
          <div className="gespace-search">
            <FiSearch size={14} className="gespace-search-icon" />
            <input
              className="gespace-search-input"
              placeholder="Buscar por nombre o identificador..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button className="gespace-search-clear" onClick={() => setBusqueda("")}>
                <FiX size={13} />
              </button>
            )}
          </div>
          <select className="gespace-select" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos los tipos</option>
            {CATEGORIAS_EDITABLES.map(c => <option key={c} value={c}>{NombreCategoria(c)}</option>)}
          </select>
          <select className="gespace-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="reservable">Reservables</option>
            <option value="no_reservable">No reservables</option>
          </select>
          <span className="gespace-count">{espaciosFiltrados.length} espacios</span>
        </div>

        {/* Error */}
        {error && <div className="gespace-error"><FiX size={14} /> {error}</div>}

        {/* Loading */}
        {loading && (
          <div className="gespace-loading">
            <FiRefreshCw size={16} className="gespace-spin" />
            Cargando espacios...
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && (
          <div className="gespace-card">
            <table className="gespace-tabla">
              <thead>
                <tr>
                  <th className="gespace-th">Espacio</th>
                  <th className="gespace-th">Categoría de reserva</th>
                  <th className="gespace-th">Reservable</th>
                  <th className="gespace-th">Asignación</th>
                  <th className="gespace-th">Aforo</th>
                  <th className="gespace-th">% Ocup.</th>
                  <th className="gespace-th">Horario</th>
                  <th className="gespace-th gespace-th--right gespace-th--sticky"></th>
                </tr>
              </thead>
              <tbody>
                {espaciosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="gespace-empty-row">
                      <FiSearch size={20} style={{ opacity: 0.3 }} />
                      <span>No se encontraron espacios</span>
                    </td>
                  </tr>
                )}
                {espaciosFiltrados.map((e) => {
                  const colorIcon = colorIconPorCategoria(e.categoria);
                  const badge     = BADGE_CFG[(e.categoria||"").toLowerCase()] || BADGE_CFG.otros;
                  const asig      = textoAsignacion(e);
                  const isEdit    = editando === e.gid;
                  const opcAsig   = opcionesAsignacion(isEdit ? form.categoria : e.categoria);

                  return (
                    <tr key={e.gid} className={`gespace-row${isEdit ? " gespace-row--editing" : ""}`}>

                      {/* Espacio */}
                      <td className="gespace-td">
                        <div className="gespace-espacio-cell">
                          <div className="gespace-espacio-icon" style={{ background: colorIcon.bg, color: colorIcon.text }}>
                            <FiMapPin size={13} />
                          </div>
                          <div>
                            <div className="gespace-espacio-nombre">{e.nombre || e.id_espacio}</div>
                            <div className="gespace-espacio-meta">
                              <span className="gespace-meta-tag">P{e.planta}</span>
                              <span className="gespace-meta-sep">·</span>
                              <span className="gespace-meta-id">{e.id_espacio}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="gespace-td">
                        {isEdit ? (
                          <select
                            className="gespace-field"
                            value={form.categoria}
                            onChange={ev => cambiarCategoria(ev.target.value)}
                          >
                            {categoriasDisponibles(form.usoFisico, form.categoria).map(c => (
                              <option key={c} value={c}>{NombreCategoria(c)}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="gespace-badge"
                            style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
                          >
                            {badge.label}
                          </span>
                        )}
                      </td>

                      {/* Reservable */}
                      <td className="gespace-td">
                        {isEdit ? (
                          <label className="gespace-switch">
                            <input
                              type="checkbox"
                              checked={form.reservable}
                              onChange={ev => setForm(f => ({ ...f, reservable: ev.target.checked }))}
                            />
                            <span className="gespace-switch-track" />
                            <span className="gespace-switch-label">{form.reservable ? "Sí" : "No"}</span>
                          </label>
                        ) : e.reservable ? (
                          <span className="gespace-chip gespace-chip--green">
                            <FiCheck size={11} /> Sí
                          </span>
                        ) : (
                          <span className="gespace-chip gespace-chip--red">
                            <FiX size={11} /> No
                          </span>
                        )}
                      </td>

                      {/* Asignación */}
                      <td className="gespace-td">
                        {isEdit ? (
                          <div className="gespace-asig-editor">
                            <div className="gespace-asig-tabs">
                              {opcAsig.map(op => (
                                <button
                                  key={op}
                                  className={`gespace-asig-tab${form.tipoAsignacion === op ? " gespace-asig-tab--active" : ""}`}
                                  onClick={() => setForm(f => ({ ...f, tipoAsignacion: op, departamentoId: "", usuariosIds: [] }))}
                                >
                                  {op === "eina" ? "EINA" : op === "departamento" ? "Departamento" : "Personas"}
                                </button>
                              ))}
                            </div>
                            {form.tipoAsignacion === "departamento" && (
                              <select
                                className="gespace-field"
                                value={form.departamentoId}
                                onChange={ev => setForm(f => ({ ...f, departamentoId: ev.target.value }))}
                              >
                                <option value="">Selecciona un departamento...</option>
                                {Object.entries(DEPARTAMENTOS).map(([id, nombre]) => (
                                  <option key={id} value={id}>{nombre}</option>
                                ))}
                              </select>
                            )}
                            {form.tipoAsignacion === "persona" && (
                              <div className="gespace-personas">
                                {usuarios.length === 0
                                  ? <p className="gespace-personas-empty">No hay usuarios disponibles</p>
                                  : usuarios.map(u => (
                                    <label
                                      key={u.id}
                                      className={`gespace-persona${form.usuariosIds.includes(String(u.id)) ? " gespace-persona--selected" : ""}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={form.usuariosIds.includes(String(u.id))}
                                        onChange={() => toggleUsuario(String(u.id))}
                                      />
                                      <div className="gespace-persona-avatar">
                                        {(u.nombre||"?").charAt(0).toUpperCase()}
                                      </div>
                                      <div className="gespace-persona-info">
                                        <span className="gespace-persona-nombre">{u.nombre}</span>
                                        <span className="gespace-persona-rol">{u.rol?.replace(/_/g, " ")}</span>
                                      </div>
                                    </label>
                                  ))
                                }
                              </div>
                            )}
                            {errForm && <p className="gespace-err"><FiX size={11} /> {errForm}</p>}
                          </div>
                        ) : (
                          <div className="gespace-asig-display">
                            {asig.tipo === "eina" && (
                              <span className="gespace-asig-pill gespace-asig-pill--eina">
                                <FiShield size={11} /> EINA
                              </span>
                            )}
                            {asig.tipo === "departamento" && (
                              <span className="gespace-asig-pill gespace-asig-pill--dpto">
                                <FiGrid size={11} />
                                {DEPARTAMENTOS[asig.id]?.includes("Informática") ? "Informática" : "Electrónica"}
                              </span>
                            )}
                            {asig.tipo === "persona" && (
                              <div className="gespace-asig-personas">
                                {(asig.usuarios||[]).slice(0, 2).map(u => (
                                  <div key={u.id} className="gespace-asig-avatar" title={u.nombre}>
                                    {(u.nombre||"?").charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {(asig.usuarios||[]).length > 2 && (
                                  <div className="gespace-asig-avatar gespace-asig-avatar--more">
                                    +{(asig.usuarios||[]).length - 2}
                                  </div>
                                )}
                                <span className="gespace-asig-nombres">
                                  {(asig.usuarios||[]).map(u => u.nombre?.split(" ")[0]).join(", ")}
                                </span>
                              </div>
                            )}
                            {asig.tipo === "ninguna" && (
                              <span className="gespace-asig-none">Sin asignar</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Aforo — solo lectura, no modificable */}
                      <td className="gespace-td">
                        <div className="gespace-aforo-cell">
                          <FiUsers size={12} className="gespace-aforo-icon" />
                          <span>{e.aforo ?? "—"}</span>
                        </div>
                      </td>

                      {/* Porcentaje ocupación */}
                      <td className="gespace-td">
                        {isEdit ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input
                              type="number" min={0} max={100}
                              className="gespace-field gespace-field--num"
                              value={form.porcentajeOcupacion}
                              onChange={ev => setForm(f => ({ ...f, porcentajeOcupacion: ev.target.value }))}
                              placeholder="—"
                            />
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>%</span>
                            {form.porcentajeOcupacion !== "" && (
                              <button
                                className="gespace-horario-reset"
                                onClick={() => setForm(f => ({ ...f, porcentajeOcupacion: "" }))}
                                title="Usar porcentaje del edificio"
                              >
                                <FiX size={11} />
                              </button>
                            )}
                          </div>
                        ) : e.porcentajeOcupacion !== null && e.porcentajeOcupacion !== undefined ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: "#374151" }}>{e.porcentajeOcupacion}%</span>
                            <span className="gespace-horario-badge">Propio</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                            <span style={{ color: "#374151" }}>{e.edificioPorcentaje ?? 100}%</span>
                            <span className="gespace-horario-badge gespace-horario-badge--edificio">Edificio</span>
                          </div>
                        )}
                      </td>

                      {/* Horario */}
                      <td className="gespace-td">
                        {isEdit ? (<>
                          <div className="gespace-horario-edit">
                            <input
                              type="time"
                              className="gespace-field gespace-field--time"
                              value={form.horarioApertura || ""}
                              onChange={ev => setForm(f => ({ ...f, horarioApertura: ev.target.value || null }))}
                              placeholder="Apertura"
                            />
                            <span className="gespace-horario-sep">–</span>
                            <input
                              type="time"
                              className="gespace-field gespace-field--time"
                              value={form.horarioCierre || ""}
                              onChange={ev => setForm(f => ({ ...f, horarioCierre: ev.target.value || null }))}
                              placeholder="Cierre"
                            />
                            {(form.horarioApertura || form.horarioCierre) && (
                              <button
                                className="gespace-horario-reset"
                                onClick={() => { setForm(f => ({ ...f, horarioApertura: null, horarioCierre: null })); setErrHorario(""); }}
                                title="Usar horario del edificio"
                              >
                                <FiX size={11} />
                              </button>
                            )}
                          </div>
                          {errHorario && <p className="gespace-err" style={{ marginTop: 4 }}><FiX size={11} /> {errHorario}</p>}
                        </>) : e.horarioApertura || e.horarioCierre ? (
                          <div className="gespace-horario">
                            <FiClock size={11} style={{ color: "#94a3b8" }} />
                            <span>{e.horarioApertura || "—"} – {e.horarioCierre || "—"}</span>
                            <span className="gespace-horario-badge">Propio</span>
                          </div>
                        ) : (
                          <div className="gespace-horario">
                            <FiClock size={11} style={{ color: "#94a3b8" }} />
                            <span>{e.edificioHorarioApertura || "—"} – {e.edificioHorarioCierre || "—"}</span>
                            <span className="gespace-horario-badge gespace-horario-badge--edificio">
                              {e.edificioNombre || "Edificio"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="gespace-td gespace-td--actions gespace-td--sticky">
                        {isEdit ? (
                          <div className="gespace-actions">
                            <button
                              className="gespace-btn-save"
                              onClick={() => guardarEdicion(e)}
                              disabled={guardando}
                              title="Guardar cambios"
                            >
                              {guardando
                                ? <FiRefreshCw size={12} className="gespace-spin" />
                                : <FiCheck size={13} />
                              }
                            </button>
                            <button
                              className="gespace-btn-cancel"
                              onClick={() => setEditando(null)}
                              title="Cancelar"
                            >
                              <FiX size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="gespace-btn-edit"
                            onClick={() => abrirEdicion(e)}
                            title="Editar espacio"
                          >
                            <FiEdit2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Nota */}
            <div className="gespace-info">
              <div className="gespace-info-icon"><FiInfo size={14} /></div>
              <div className="gespace-info-text">
                <strong>Reglas de asignación</strong>
                <span>
                  Aulas y salas comunes → solo EINA · Seminarios y laboratorios → EINA o departamento ·
                  Despachos → departamento o persona con rol investigador (no reservables si asignados a personas no visitantes)
                </span>
              </div>
            </div>

            <div className="gespace-footer">
              Mostrando <strong>{espaciosFiltrados.length}</strong> de <strong>{espacios.length}</strong> espacios
            </div>
          </div>
        )}

      </main>
    </div>
  );
}