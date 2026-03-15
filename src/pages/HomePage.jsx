import { useMemo, useState } from "react";
import { useEspaciosGeo } from "../hooks/useEspaciosGeo";
import MapaEspacios from "../components/MapaEspacios";
import "./HomePage.css";

export default function HomePage() {
  const { data, loading, error } = useEspaciosGeo();
  const [plantaSeleccionada, setPlantaSeleccionada] = useState("");
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);

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
    // "0","1","2"...
    return Array.from(unicas).sort((a, b) => Number(a) - Number(b));
    }, [data]);

  return (
    <div className="home-root">
      <header className="home-header">
        <div>
          <h1 className="home-title">ByronSpace</h1>
          <p className="home-subtitle">
            Mapa interactivo de espacios del edificio Ada Byron
          </p>
        </div>
      </header>

      <div className="home-layout">
        {/* Panel lateral: filtros + detalle */}
        <aside className="home-sidebar">
          <section className="card">
            <h2 className="card-title">Filtros</h2>
            <label className="form-label" htmlFor="planta">
              Planta
            </label>
            <select
              id="planta"
              className="form-select"
              value={plantaSeleccionada}
              onChange={(e) => setPlantaSeleccionada(e.target.value)}
            >
              <option value="">Todas</option>
              {plantas.map((planta) => (
                <option key={planta} value={planta}>
                  {`P${planta}`}
                </option>
              ))}
            </select>
          </section>

          {espacioSeleccionado && (
            <section className="card">
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
            </section>
          )}
        </aside>

        {/* Contenido principal: mapa + leyenda */}
        <main className="home-main">
          <section className="map-card">
            <div className="map-header">
              <h2 className="map-title">Mapa de espacios</h2>
              <p className="map-subtitle">
                Haz clic en un espacio para ver más detalles
              </p>
            </div>

            <div className="map-wrapper">
              {loading && (
                <div className="map-overlay">Cargando espacios…</div>
              )}
              {error && <div className="map-overlay">{error}</div>}

              {data && (
                <MapaEspacios
                  geoData={data}
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
                <span className="legend-color legend-seminario" />
                <span>Seminario</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-despacho" />
                <span>Despacho</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-comun" />
                <span>Sala común</span>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}