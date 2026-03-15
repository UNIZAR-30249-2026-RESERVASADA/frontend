import { useMemo, useState } from "react";
import { useEspaciosGeo } from "../hooks/useEspaciosGeo";
import MapaEspacios from "../components/MapaEspacios";
import { FiSearch } from "react-icons/fi";  
import "./HomePage.css";

export default function HomePage() {
  const { data, loading, error } = useEspaciosGeo();
  const [plantaSeleccionada, setPlantaSeleccionada] = useState("");
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);
  const [textoBusqueda, setTextoBusqueda] = useState(""); 
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas"); // <-- AÑADIDO


  const plantas = useMemo(() => {
    if (!data) return [];
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

    return data.features.filter((f) => {
      const props = f.properties || {};
      const planta =
        props.planta ?? props.PLANTA ?? props.Altura ?? props.altura ?? null;
      const uso = (props.uso || "").toLowerCase();
      const nombre = (props.nombre || "").toLowerCase();
      const idEspacio = (props.id_espacio || "").toLowerCase();

      // 1) Filtro de planta
      if (plantaSeleccionada !== "" && plantaSeleccionada !== null) {
        if (String(planta) !== String(plantaSeleccionada)) return false;
      }

      // 2) Filtro de categoría (por uso)
      if (filtroCategoria !== "todas") {
        switch (filtroCategoria) {
          case "laboratorio":
            if (!uso.includes("laboratorio")) return false;
            break;
          case "aula":
            if (!uso.includes("aula")) return false;
            break;
          case "comun":
            if (!uso.includes("común") && !uso.includes("comun")) return false;
            break;
          case "despacho":
            if (!uso.includes("despacho")) return false;
            break;
          case "seminario":
            if (!uso.includes("seminario")) return false;
            break;
          case "pasillo":
            if (!uso.includes("pasillo")) return false;
            break;
          default:
            break;
        }
      }

      // 3) Filtro de texto (nombre, id_espacio o uso)
      if (filtroTexto) {
        if (
          !nombre.includes(filtroTexto) &&
          !idEspacio.includes(filtroTexto) &&
          !uso.includes(filtroTexto)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [data, plantaSeleccionada, textoBusqueda, categoriaSeleccionada]);

  return (
    <div className="home-root">
      {/* TOPBAR estilo app */}
      <header className="home-topbar">
        <div className="home-topbar-left">
          <div className="home-logo-circle">B</div>
          <div>
            <h1 className="home-app-title">ByronSpace</h1>
            <p className="home-app-subtitle">
              Sistema de Reservas · Ada Byron
            </p>
          </div>
        </div>
        <div className="home-topbar-right">
          <button className="home-topbar-link">Mis reservas</button>
          <div className="home-user-circle">U</div>
        </div>
      </header>

      <div className="home-layout">
        {/* Panel lateral: filtros + detalle */}
        <aside className="home-sidebar">
          <section className="card card-filtros">
            <h2 className="card-title">Filtros</h2>

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

          <section className="card card-resultados">
            <div className="resultados-header">
              <h2 className="card-title">
                Resultados ({espaciosFiltrados.length})
              </h2>
            </div>
            <div className="resultados-list">
              {espaciosFiltrados.map((f) => {
                const e = f.properties || {};
                const disponible = e.reservable !== false; // ajusta si tienes otro campo
                return (
                  <div
                    key={e.id_espacio || e.gid}
                    className="resultado-item"
                  >
                    <div
                      className="resultado-click"
                      onClick={() => setEspacioSeleccionado(e)}
                    >
                      <div className="resultado-header-line">
                        <div className="resultado-nombre-uso">
                          <div className="resultado-nombre">
                            {e.nombre || e.id_espacio || "Espacio"}
                          </div>
                          <div className="resultado-uso">
                            {e.uso || "Sin uso"}
                          </div>
                        </div>
                        <span className="resultado-square" />
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
                    </div>

                    <button
                      className={
                        "resultado-reservar-btn" +
                        (disponible
                          ? ""
                          : " resultado-reservar-btn--disabled")
                      }
                      disabled={!disponible}
                      onClick={() => disponible && setEspacioSeleccionado(e)}
                    >
                      Reservar
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {espacioSeleccionado && (
            <section className="card card-detalle">
              <h2 className="detail-card-title">Espacio seleccionado</h2>
              <p className="detail-row">
                <strong>Nombre:</strong>{" "}
                {espacioSeleccionado.nombre || "N/D"}
              </p>
              <p className="detail-row">
                <strong>ID:</strong>{" "}
                {espacioSeleccionado.id_espacio || "N/D"}
              </p>
              <p className="detail-row">
                <strong>Uso:</strong> {espacioSeleccionado.uso || "N/D"}
              </p>
              <p className="detail-row">
                <strong>Planta:</strong>{" "}
                {espacioSeleccionado.planta || "N/D"}
              </p>
              <p className="detail-row">
                <strong>Reservable:</strong>{" "}
                {espacioSeleccionado.reservable ? "Sí" : "No"}
              </p>
              <button className="btn-primary btn-full">Reservar</button>
            </section>
          )}
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
                />
              )}
            </div>

            <footer className="legend">
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
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}