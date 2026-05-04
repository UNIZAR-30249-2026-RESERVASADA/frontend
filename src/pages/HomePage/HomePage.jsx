import { useMemo, useState, useEffect } from "react";
import { useEspaciosGeo } from "../../hooks/useEspaciosGeo";
import { useAuth } from "../../hooks/useAuth";
import MapaEspacios from "../../components/MapaEspacios";
import { FiSearch, FiInfo, FiUsers, FiClock } from "react-icons/fi";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import { colorPorCategoria } from "../../utils/coloresEspacio";
import { puedeReservarEspacio, categoriasLibres, categoriasConRestriccionDepartamento } from "../../utils/restriccionesReserva";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const { data, loading, error } = useEspaciosGeo();
  const { usuario, loading: authLoading } = useAuth();
  const [plantaSeleccionada,    setPlantaSeleccionada]    = useState("");
  const [espacioSeleccionado,   setEspacioSeleccionado]   = useState(null);
  const [espaciosSeleccionados, setEspaciosSeleccionados] = useState([]);
  const [textoBusqueda,         setTextoBusqueda]         = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [mostrarTooltip,        setMostrarTooltip]        = useState(false);
  const [mostrarPermisos,       setMostrarPermisos]       = useState(false);
  const [capacidadMinima,       setCapacidadMinima]       = useState(0);

  useEffect(() => {
    if (!authLoading && !usuario) {
      navigate("/login", { replace: true });
    }
  }, [usuario, authLoading, navigate]);

  const plantas = useMemo(() => {
    if (!data || !data.features) return [];
    const unicas = new Set(
      data.features
        .map((f) => f.properties?.planta ?? f.properties?.PLANTA ?? f.properties?.Altura ?? f.properties?.altura ?? null)
        .filter((v) => v !== null)
    );
    return Array.from(unicas).sort((a, b) => Number(a) - Number(b));
  }, [data]);

  const puedeReservar = (espacio) => {
    if (!usuario) return false;
    return puedeReservarEspacio(espacio, usuario).puede;
  };

  const DEPARTAMENTOS = {
    1: "Informática e Ingeniería de Sistemas",
    2: "Ingeniería Electrónica y Comunicaciones",
  };

  const getNombreDepartamento = () => {
    if (!usuario?.departamentoId) return null;
    return DEPARTAMENTOS[Number(usuario.departamentoId)] || null;
  };

  const getRestriccionesLineas = () => {
    if (usuario?.esGerente) return [
      "Rol: gerente",
      "Puedes reservar siempre: todo lo que esté marcado como reservable",
    ];
    if (!usuario?.rol) return ["Sin permisos definidos"];
    const rol      = usuario.rol.toLowerCase();
    const libres   = categoriasLibres(rol);
    const conDpto  = categoriasConRestriccionDepartamento(rol);
    const nombreDpto = getNombreDepartamento();
    const lineas = [];
    lineas.push(`Rol: ${usuario.rol}`);
    if (nombreDpto) lineas.push(`Departamento: ${nombreDpto}`);
    if (libres.length > 0) lineas.push(`Puedes reservar siempre: ${libres.join(", ")}`);
    if (conDpto.length > 0 && nombreDpto) {
      lineas.push(`Puedes reservar si es de tu departamento: ${conDpto.join(", ")}`);
      if (conDpto.includes("despacho")) {
        lineas.push("*Los despachos solo si están asignados a un departamento o investigador visitante");
      }
    }
    return lineas;
  };

  const estaSeleccionado = (e) => {
    const id = e.gid || e.id_espacio;
    return espaciosSeleccionados.some((s) => (s.gid || s.id_espacio) === id);
  };

  const toggleSeleccion = (e, f) => {
    const id = e.gid || e.id_espacio;
    if (estaSeleccionado(e)) {
      setEspaciosSeleccionados((prev) => prev.filter((s) => (s.gid || s.id_espacio) !== id));
    } else {
      setEspaciosSeleccionados((prev) => [...prev, { gid: f.id || e.gid, ...e }]);
    }
  };

  const handleReservar = () => {
    if (espaciosSeleccionados.length === 0) return;
    navigate("/reserva", { state: { espacios: espaciosSeleccionados } });
  };

  const espaciosFiltrados = useMemo(() => {
    if (!data) return [];
    const filtroTexto     = textoBusqueda.trim().toLowerCase();
    const filtroCategoria = categoriaSeleccionada;

    return data.features.filter((f) => {
      const props     = f.properties || {};
      const planta    = props.planta ?? props.PLANTA ?? props.Altura ?? props.altura ?? null;
      const categoria = (props.categoria || "").toLowerCase();
      const nombre    = (props.nombre || "").toLowerCase();
      const idEspacio = (props.id_espacio || "").toLowerCase();

      if (plantaSeleccionada !== "" && String(planta) !== String(plantaSeleccionada)) return false;

      if (filtroCategoria !== "todas") {
        let categoriaValida = false;
        switch (filtroCategoria) {
          case "laboratorio":
            categoriaValida = categoria.includes("laboratorio") || categoria.includes("lab") ||
              categoria.includes("informática") || categoria.includes("informatica") || categoria.includes("sala informatica");
            break;
          case "aula":      categoriaValida = categoria.includes("aula");      break;
          case "comun":     categoriaValida = categoria.includes("común") || categoria.includes("comun"); break;
          case "despacho":  categoriaValida = categoria.includes("despacho");  break;
          case "seminario": categoriaValida = categoria.includes("seminario"); break;
          case "pasillo":   categoriaValida = categoria.includes("pasillo");   break;
          case "otros":     categoriaValida = categoria.includes("otros");     break;
          default:          categoriaValida = false;
        }
        if (!categoriaValida) return false;
      }

      if (filtroTexto) {
        if (!nombre.includes(filtroTexto) && !idEspacio.includes(filtroTexto) && !categoria.includes(filtroTexto)) return false;
      }

      if (capacidadMinima > 0) {
        const aforo = Number(props.aforo ?? 0);
        if (aforo < capacidadMinima) return false;
      }

      return true;
    });
  }, [data, plantaSeleccionada, textoBusqueda, categoriaSeleccionada, capacidadMinima]);

  if (authLoading) return null;
  if (!usuario)    return null;

  return (
    <div className="home-root">
      <Header />

      <div className="home-layout">
        <aside className="home-sidebar">
          <section className="card card-filtros">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h2 className="card-title">Filtros</h2>
              <div style={{ position: "relative" }}>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#2563eb" }}
                  onClick={() => setMostrarTooltip(!mostrarTooltip)}
                  title="Información sobre Uso vs Categoría"
                >
                  <FiInfo />
                </button>
                {mostrarTooltip && (
                  <div style={{
                    position: "absolute", top: "28px", right: "0",
                    backgroundColor: "#1e40af", color: "#ffffff",
                    padding: "10px 12px", borderRadius: "6px",
                    fontSize: "12px", width: "200px", zIndex: 1000,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)", lineHeight: "1.5",
                  }}>
                    <strong style={{ display: "block", marginBottom: "5px" }}>Uso vs Categoría:</strong>
                    <div style={{ marginBottom: "5px" }}><strong>Uso:</strong> Original del espacio (fijo)</div>
                    <div><strong>Categoría:</strong> Clasificación actual (modificable)</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              backgroundColor: "#fef3c7", border: "1px solid #fcd34d",
              borderRadius: "6px", padding: "8px 10px", marginBottom: "16px",
              fontSize: "12px", color: "#92400e", lineHeight: "1.6",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{getRestriccionesLineas()[0]}</strong>
                <button
                  onClick={() => setMostrarPermisos(!mostrarPermisos)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#92400e", textDecoration: "underline", padding: 0, flexShrink: 0 }}
                >
                  {mostrarPermisos ? "Ocultar" : "Ver más"}
                </button>
              </div>
              {mostrarPermisos && getRestriccionesLineas().slice(1).map((linea, idx) => (
                <div key={idx} style={{ marginTop: 3, fontStyle: linea.startsWith("*") ? "italic" : "normal", opacity: linea.startsWith("*") ? 0.8 : 1 }}>
                  {linea}
                </div>
              ))}
            </div>

            <label className="form-label" htmlFor="buscar">Buscar</label>
            <div className="field-with-icon">
              <FiSearch className="field-icon" />
              <input
                id="buscar" className="form-input"
                placeholder="Nombre del espacio..."
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
              />
            </div>

            <label className="form-label" htmlFor="categoria">Categoría</label>
            <div className="field-select">
              <select id="categoria" className="form-select" value={categoriaSeleccionada} onChange={(e) => setCategoriaSeleccionada(e.target.value)}>
                <option value="todas">Todas las categorías</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="aula">Aula</option>
                <option value="comun">Sala común</option>
                <option value="despacho">Despacho</option>
                <option value="seminario">Seminario</option>
                <option value="pasillo">Pasillo</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <label className="form-label" htmlFor="capacidad">Capacidad mínima</label>
            <div className="field-select">
              <select
                id="capacidad"
                className="form-select"
                value={capacidadMinima}
                onChange={(e) => setCapacidadMinima(Number(e.target.value))}
              >
                <option value={0}>Cualquier capacidad</option>
                <option value={10}>10+ personas</option>
                <option value={20}>20+ personas</option>
                <option value={30}>30+ personas</option>
                <option value={50}>50+ personas</option>
                <option value={100}>100+ personas</option>
              </select>
            </div>

            <div className="form-label form-label-inline"><span>Planta</span></div>
            <div className="plantas-chips">
              <button
                className={"planta-chip" + (plantaSeleccionada === "" ? " planta-chip--active" : "")}
                onClick={() => setPlantaSeleccionada("")}
              >
                Todas
              </button>
              {plantas.map((planta) => {
                const value    = String(planta);
                const isActive = value === String(plantaSeleccionada);
                return (
                  <button
                    key={planta}
                    className={"planta-chip" + (isActive ? " planta-chip--active" : "")}
                    onClick={() => setPlantaSeleccionada(value)}
                  >
                    {`P${planta}`}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card card-resultados" key={`resultados-${categoriaSeleccionada}-${plantaSeleccionada}-${textoBusqueda}`}>
            <div className="resultados-header">
              <h2 className="card-title">Resultados ({espaciosFiltrados.length})</h2>
              <button
                className={
                  "resultado-reservar-btn resultado-reservar-btn--header" +
                  (espaciosSeleccionados.length > 0 ? " resultado-reservar-btn--header-activo" : " resultado-reservar-btn--disabled")
                }
                disabled={espaciosSeleccionados.length === 0}
                onClick={handleReservar}
              >
                {espaciosSeleccionados.length > 0 ? `Reservar (${espaciosSeleccionados.length})` : "Reservar"}
              </button>
            </div>

            <div className="resultados-list">
              {espaciosFiltrados.map((f) => {
                const e          = f.properties || {};
                const disponible = e.reservable !== false;
                const isSelected = espacioSeleccionado?.id_espacio === e.id_espacio || espacioSeleccionado?.gid === e.gid;
                const seleccionado = estaSeleccionado(e);
                const resultado  = puedeReservarEspacio(e, usuario);

                return (
                  <div
                    key={`${categoriaSeleccionada}-${plantaSeleccionada}-${e.id_espacio || e.gid}`}
                    className={[
                      "resultado-item",
                      isSelected   ? "resultado-item--selected" : "",
                      seleccionado ? "resultado-item--checked"  : "",
                    ].join(" ")}
                    ref={isSelected ? (el) => el?.scrollIntoView({ behavior: "smooth", block: "nearest" }) : null}
                  >
                    <div className="resultado-click" onClick={() => setEspacioSeleccionado(isSelected ? null : e)}>
                      <div className="resultado-header-line">
                        <div className="resultado-nombre-uso">
                          <div className="resultado-nombre">{e.nombre || e.id_espacio || "Espacio"}</div>
                          <div className="resultado-uso">
                            <div style={{ fontSize: "11px", color: "#666", marginBottom: "2px" }}>Uso: {e.uso || "N/D"}</div>
                            {e.categoria && (
                              <div style={{ fontSize: "11px", color: colorPorCategoria(e.categoria), fontWeight: "500" }}>
                                Cat: {e.categoria}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="resultado-square" style={{ backgroundColor: colorPorCategoria(e.categoria) }} />
                      </div>

                      <div className="resultado-subinfo">
                        <FiUsers size={11} style={{ color: "#6b7280", flexShrink: 0 }} />
                        <span>{e.aforo ?? "N/D"} personas</span>
                        <span className="resultado-dot">·</span>
                        <span className={"resultado-estado-text " + (disponible ? "resultado-estado-disponible" : "resultado-estado-ocupado")}>
                          {disponible ? "Reservable" : "No reservable"}
                        </span>
                      </div>
                      {(e.horarioApertura || e.edificioHorarioApertura) && (
                        <div className="resultado-horario">
                          <FiClock size={11} style={{ color: "#6b7280", flexShrink: 0 }} />
                          <span>
                            {e.horarioApertura
                              ? `${e.horarioApertura} – ${e.horarioCierre}`
                              : `${e.edificioHorarioApertura} – ${e.edificioHorarioCierre}`
                            }
                          </span>
                          {e.horarioApertura
                            ? <span className="resultado-horario-badge resultado-horario-badge--propio">Propio</span>
                            : <span className="resultado-horario-badge">{e.edificioNombre || "Edificio"}</span>
                          }
                        </div>
                      )}
                      {(e.asignadoAEina || e.departamentoId || (e.usuariosAsignados ?? []).length > 0) && (
                        <div style={{ fontSize: "10px", color: "#6b7280", marginTop: 2 }}>
                          {e.asignadoAEina && <span>Asignado a la EINA</span>}
                          {!e.asignadoAEina && e.departamentoId && !(e.usuariosAsignados ?? []).length && (
                            <span>Dpto: {String(e.departamentoId) === "1" ? "Informática" : "Electrónica"}</span>
                          )}
                          {(e.usuariosAsignados ?? []).length > 0 && (
                            <span>Asignado a: {(e.usuariosAsignados ?? []).map((u) => u.nombre + " (" + u.rol + ")").join(", ")}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      className={[
                        "resultado-reservar-btn",
                        seleccionado ? "resultado-reservar-btn--seleccionado" : "",
                        !disponible || !resultado.puede ? "resultado-reservar-btn--disabled" : "",
                      ].join(" ")}
                      disabled={!disponible || !resultado.puede}
                      title={!resultado.puede ? resultado.motivo : ""}
                      onClick={() => toggleSeleccion(e, f)}
                    >
                      {seleccionado ? "Deseleccionar" : "Seleccionar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <main className="home-main">
          <section className="map-card">
            <div className="map-header">
              <div>
                <h2 className="map-title">
                  Mapa del Edificio · Planta {plantaSeleccionada !== "" ? `P${plantaSeleccionada}` : "Todas"}
                </h2>
                <p className="map-subtitle">Haz clic en un espacio para ver más detalles y reservar</p>
              </div>
            </div>
            <div className="map-wrapper">
              {loading && <div className="map-overlay">Cargando espacios…</div>}
              {error   && <div className="map-overlay">{error}</div>}
              {data && (
                <MapaEspacios
                  geoData={{ ...data, features: espaciosFiltrados }}
                  plantaSeleccionada={plantaSeleccionada}
                  onSeleccionarEspacio={setEspacioSeleccionado}
                  espacioSeleccionado={espacioSeleccionado}
                />
              )}
            </div>
            <footer className="legend">
              <div className="legend-item"><span className="legend-color legend-aula" /><span>Aula</span></div>
              <div className="legend-item"><span className="legend-color legend-lab" /><span>Laboratorio</span></div>
              <div className="legend-item"><span className="legend-color legend-comun" /><span>Sala común</span></div>
              <div className="legend-item"><span className="legend-color legend-despacho" /><span>Despacho</span></div>
              <div className="legend-item"><span className="legend-color legend-seminario" /><span>Seminario</span></div>
              <div className="legend-item"><span className="legend-color legend-pasillo" /><span>Pasillo</span></div>
              <div className="legend-item"><span className="legend-color legend-otros" /><span>Otros</span></div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}