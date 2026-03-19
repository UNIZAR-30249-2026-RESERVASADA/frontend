import { useMemo, useState, useEffect } from "react";
import { useEspaciosGeo } from "../hooks/useEspaciosGeo";
import { useAuth } from "../hooks/useAuth";
import { useRestriccionesReserva } from "../hooks/useRestriccionesReserva";
import MapaEspacios from "../components/MapaEspacios";
import { FiSearch, FiInfo, FiLogOut } from "react-icons/fi";  
import { useNavigate } from "react-router-dom";
import unizarLogo from "../assets/images/unizar.png";
import "./HomePage.css";

// Función para obtener color según categoría (ahora usa el campo categoria)
function colorPorCategoria(categoria) {
  const valor = (categoria || "").toLowerCase();

  if (
    valor.includes("laboratorio") ||
    valor.includes("lab") ||
    valor.includes("informática") ||
    valor.includes("informatica") ||
    valor.includes("sala informatica")
  ) {
    return "#3b82f6"; // azul para labs + salas informáticas
  }  
  if (valor.includes("despacho")) return "#ef4444";
  if (valor.includes("seminario")) return "#facc15";
  if (valor.includes("aula")) return "#f59e0b";
  if (valor.includes("común") || valor.includes("comun")) return "#22c55e";
  if (valor.includes("pasillo")) return "#8b5cf6"; // púrpura para pasillos
  
  return "#9ca3af"; // gris claro para otros/sin clasificar
}

export default function HomePage() {  const navigate = useNavigate();
  const { data, loading, error } = useEspaciosGeo();
  const { usuario, loading: authLoading, logout } = useAuth();
  const { restricciones } = useRestriccionesReserva(usuario?.rol);
  
  const [plantaSeleccionada, setPlantaSeleccionada] = useState("");
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);
  const [textoBusqueda, setTextoBusqueda] = useState(""); 
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [mostrarTooltip, setMostrarTooltip] = useState(false);

  // Redirigir a login si no hay usuario (esperar a que authLoading sea false)
  useEffect(() => {
    if (authLoading) {
      // Aún cargando, no hacer nada
      return;
    }

    if (!usuario) {
      console.log("HomePage: usuario no está, redirigiendo a login");
      navigate("/login", { replace: true });
    } else {
      console.log("HomePage: usuario presente:", usuario.nombre);
    }
  }, [usuario, authLoading, navigate]);
  // Función para verificar si el usuario puede reservar un espacio según su rol
  // (solo para UI, la verdadera validación está en el backend)
  const puedeReservar = (espacio) => {
    if (!restricciones || !restricciones.puedereservar) return false;

    const categoria = (espacio.categoria || "").toLowerCase();
    const rol = usuario?.rol?.toLowerCase();

    // Validación básica de categoría
    const tieneCategoria = restricciones.puedereservar.some(cat => categoria.includes(cat));
    
    if (!tieneCategoria) return false;

    // Para laboratorios, validar departamento (si aplica)
    if (categoria.includes("laboratorio")) {
      // Si la restricción menciona "solo de tu dpto", verificar departamento
      if (restricciones.mensaje.includes("solo de tu dpto")) {
        return usuario?.departamentoId === espacio.departamentoId;
      }
    }

    return true;
  };

  // Obtener mensaje de restricción desde el backend
  const getRestriccionesTexto = () => {
    return restricciones?.mensaje || "Cargando permisos...";
  };
  const plantas = useMemo(() => {
    if (!data || !data.features) return [];
    const unicas = new Set(
      data.features
        .map(
          (f) =>
            f.properties?.planta ??
            f.properties?.PLANTA ??
            f.properties?.Altura ??
            f.properties?.altura ??
            null
        )
        .filter((v) => v !== undefined && v !== null)
    );
    return Array.from(unicas).sort((a, b) => Number(a) - Number(b));
  }, [data]);

  const espaciosFiltrados = useMemo(() => {
    if (!data) return [];
    const filtroTexto = textoBusqueda.trim().toLowerCase();
    const filtroCategoria = categoriaSeleccionada;

    console.log("FILTRO APLICADO:", { filtroCategoria, textoBusqueda }); // <-- DEBUG
    const resultado = data.features.filter((f) => {
      const props = f.properties || {};
      const planta =
        props.planta ?? props.PLANTA ?? props.Altura ?? props.altura ?? null;
      const categoria = (props.categoria || "").toLowerCase();
      const nombre = (props.nombre || "").toLowerCase();
      const idEspacio = (props.id_espacio || "").toLowerCase();

      // 1) Filtro de planta
      if (plantaSeleccionada !== "" && plantaSeleccionada !== null) {
        if (String(planta) !== String(plantaSeleccionada)) return false;
      }

      // 2) Filtro de categoría (por categoria, no por uso)
      if (filtroCategoria !== "todas") {
        let categoriaValida = false;
        
        switch (filtroCategoria) {
          case "laboratorio":
            categoriaValida =
              categoria.includes("laboratorio") ||
              categoria.includes("lab") ||
              categoria.includes("informática") ||
              categoria.includes("informatica") ||
              categoria.includes("sala informatica");
            break;
          case "aula":
            categoriaValida = categoria.includes("aula");
            break;
          case "comun":
            categoriaValida = categoria.includes("común") || categoria.includes("comun");
            break;
          case "despacho":
            categoriaValida = categoria.includes("despacho");
            break;
          case "seminario":
            categoriaValida = categoria.includes("seminario");
            break;
          case "pasillo":
            categoriaValida = categoria.includes("pasillo");
            break;
          default:
            categoriaValida = false;
            break;
        }
        
        if (!categoriaValida) return false;
      }

      // 3) Filtro de texto (nombre, id_espacio o categoria)
      if (filtroTexto) {
        if (
          !nombre.includes(filtroTexto) &&
          !idEspacio.includes(filtroTexto) &&
          !categoria.includes(filtroTexto)
        ) {
          return false;
        }
      }

      return true;
    });

    // DEBUG: log los espacios cuando hay filtro de categoría
    if (filtroCategoria !== "todas") {
      console.log(
        `DEBUG filtroCategoria=${filtroCategoria}, resultados=${resultado.length}`,
        resultado.map((f) => ({ id: f.properties?.id_espacio, uso: f.properties?.uso }))
      );
    }

    return resultado;
  }, [data, plantaSeleccionada, textoBusqueda, categoriaSeleccionada]);
  // Si aún está cargando la autenticación, no renderizar nada
  if (authLoading) {
    return null;
  }

  // Si no hay usuario, no renderizar nada (el useEffect redirige a login)
  if (!usuario) {
    return null;
  }

  return (
    <div className="home-root">{/* TOPBAR estilo app */}      <header className="home-topbar">
        <div className="home-topbar-left">
          <img src={unizarLogo} alt="Universidad Zaragoza" className="home-logo-img" />
          <div>
            <h1 className="home-app-title">ByronSpace</h1>
            <p className="home-app-subtitle">
              Sistema de Reservas · Ada Byron
            </p>
          </div>
        </div>
        <div className="home-topbar-right">
          <button className="home-topbar-link">Mis reservas</button>
          <div className="home-user-info">
            <div className="home-user-details">
              <div className="home-user-name">{usuario?.nombre || "Usuario"}</div>
              <div className="home-user-role">{usuario?.rol || "Sin rol"}</div>
            </div>
            <div className="home-user-circle">
              {(usuario?.nombre || "U").charAt(0).toUpperCase()}
            </div>
          </div>
          <button
            className="home-topbar-logout"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            title="Cerrar sesión"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      <div className="home-layout">
        {/* Panel lateral: filtros + detalle */}
        <aside className="home-sidebar">          <section className="card card-filtros">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 className="card-title">Filtros</h2>
              <div style={{ position: 'relative' }}>
                <button 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#2563eb'
                  }}
                  onClick={() => setMostrarTooltip(!mostrarTooltip)}
                  title="Información sobre Uso vs Categoría"
                >
                  <FiInfo />
                </button>
                
                {mostrarTooltip && (
                  <div style={{
                    position: 'absolute',
                    top: '28px',
                    right: '0',
                    backgroundColor: '#1e40af',
                    color: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    width: '200px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    lineHeight: '1.5'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>Uso vs Categoría:</strong>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>Uso:</strong> Original del espacio (fijo)
                    </div>
                    <div>
                      <strong>Categoría:</strong> Clasificación actual (modificable)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mostrar restricciones de usuario */}
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '6px',
              padding: '8px 10px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#92400e',
            }}>
              <strong>Tu rol: {usuario?.rol || "Sin rol"}</strong>
              <div style={{ marginTop: '4px' }}>
                {getRestriccionesTexto()}
              </div>
            </div>

            <label className="form-label" htmlFor="buscar">
              Buscar
            </label>
            <div className="field-with-icon">
              <FiSearch className="field-icon" />   {/* icono normal de lupa */}
              <input
                id="buscar"
                className="form-input"
                placeholder="Nombre del espacio..."
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
              />
            </div>

            <label className="form-label" htmlFor="categoria">
              Categoría
            </label>
            <div className="field-select">
              <select
                id="categoria"
                className="form-select"
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              >
                <option value="todas">Todas las categorías</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="aula">Aula</option>
                <option value="comun">Sala común</option>
                <option value="despacho">Despacho</option>
                <option value="seminario">Seminario</option>
                <option value="pasillo">Pasillo</option>
              </select>
            </div>

            <label className="form-label" htmlFor="capacidad">
              Capacidad mínima
            </label>
            <div className="field-select">
              <select id="capacidad" className="form-select">
                <option>Cualquier capacidad</option>
                <option>10+</option>
                <option>20+</option>
                <option>30+</option>
              </select>
            </div>

            <div className="form-label form-label-inline">
              <span>Planta</span>
            </div>
            <div className="plantas-chips">
              <button
                className={
                  "planta-chip" + (plantaSeleccionada === "" ? " planta-chip--active" : "")
                }
                onClick={() => setPlantaSeleccionada("")}
              >
                Todas
              </button>

              {plantas.map((planta) => {
                const value = String(planta);
                const isActive = value === String(plantaSeleccionada);
                return (
                  <button
                    key={planta}
                    className={
                      "planta-chip" + (isActive ? " planta-chip--active" : "")
                    }
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
              <h2 className="card-title">
                Resultados ({espaciosFiltrados.length})
              </h2>
            </div>
            <div className="resultados-list">
              {espaciosFiltrados.map((f) => {
                const e = f.properties || {};
                const disponible = e.reservable !== false; // ajusta si tienes otro campo
                const isSelected = espacioSeleccionado?.id_espacio === e.id_espacio || espacioSeleccionado?.gid === e.gid;
                return (
                  <div
                    key={`${categoriaSeleccionada}-${plantaSeleccionada}-${e.id_espacio || e.gid}`}
                    className={`resultado-item ${isSelected ? 'resultado-item--selected' : ''}`}
                    ref={isSelected ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) : null}
                  >
                    <div
                      className="resultado-click"
                      onClick={() => {
                        // Si ya está seleccionado, deseleccionar; si no, seleccionar
                        if (isSelected) {
                          setEspacioSeleccionado(null);
                        } else {
                          setEspacioSeleccionado(e);
                        }
                      }}
                    >                      
                    <div className="resultado-header-line">
                        <div className="resultado-nombre-uso">
                          <div className="resultado-nombre">
                            {e.nombre || e.id_espacio || "Espacio"}
                          </div>                          <div className="resultado-uso">
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                              Uso: {e.uso || "N/D"}
                            </div>
                            {e.categoria && (
                              <div style={{ fontSize: '11px', color: colorPorCategoria(e.categoria), fontWeight: '500' }}>
                                Cat: {e.categoria}
                              </div>
                            )}
                          </div>
                        </div>                        
                        <span 
                          className="resultado-square"
                          style={{ backgroundColor: colorPorCategoria(e.categoria) }}
                        />
                      </div>

                      <div className="resultado-subinfo">
                        <span className="resultado-personas-icon">👤</span>
                        <span className="resultado-personas">
                          {e.aforo ?? "N/D"} personas
                        </span>
                        <span className="resultado-dot">·</span>
                        <span
                          className={
                            "resultado-estado-text " +
                            (disponible
                              ? "resultado-estado-disponible"
                              : "resultado-estado-ocupado")
                          }
                        >
                          {disponible ? "Disponible" : "Ocupado"}
                        </span>
                      </div>
                    </div>                    <button
                      className={
                        "resultado-reservar-btn" +
                        (disponible && puedeReservar(e)
                          ? ""
                          : " resultado-reservar-btn--disabled")
                      }
                      disabled={!disponible || !puedeReservar(e)}
                      title={!puedeReservar(e) ? "Tu rol no permite reservar este tipo de espacio" : ""}
                      onClick={() => {
                        if (disponible && puedeReservar(e)) {
                          const espacioParaReserva = {
                            gid: f.id || e.gid,
                            ...e,
                          };
                          navigate("/reserva", { state: { espacio: espacioParaReserva } });
                        }
                      }}
                    >
                      Reservar
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        {/* Contenido principal: mapa + leyenda */}
        <main className="home-main">
          <section className="map-card">
            <div className="map-header">
              <div>
                <h2 className="map-title">
                  Mapa del Edificio · Planta{" "}
                  {plantaSeleccionada !== ""
                    ? `P${plantaSeleccionada}`
                    : "Todas"}
                </h2>
                <p className="map-subtitle">
                  Haz clic en un espacio para ver más detalles y reservar
                </p>
              </div>
            </div>

            <div className="map-wrapper">
              {loading && (
                <div className="map-overlay">Cargando espacios…</div>
              )}
              {error && <div className="map-overlay">{error}</div>}              
              {data && (
                <MapaEspacios
                  geoData={{
                    ...data,
                    features: espaciosFiltrados, // <-- solo los filtrados
                  }}
                  plantaSeleccionada={plantaSeleccionada}
                  onSeleccionarEspacio={setEspacioSeleccionado}
                  espacioSeleccionado={espacioSeleccionado}
                />
              )}
            </div>            <footer className="legend">
              <div className="legend-item">
                <span className="legend-color legend-aula" />
                <span>Aula</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-lab" />
                <span>Laboratorio</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-comun" />
                <span>Sala común</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-despacho" />
                <span>Despacho</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-seminario" />
                <span>Seminario</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-pasillo" />
                <span>Pasillo</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-otros" />
                <span>Otros</span>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}