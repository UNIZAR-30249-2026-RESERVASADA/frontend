import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";

function colorPorUso(uso) {
  const valor = (uso || "").toLowerCase();

  if (valor.includes("laboratorio")) return "#3b82f6";
  if (valor.includes("despacho")) return "#ef4444";
  if (valor.includes("seminario")) return "#facc15";
  if (valor.includes("aula")) return "#f59e0b";
  if (valor.includes("común") || valor.includes("comun")) return "#22c55e";

  return "#6b7280";
}

function AjustarAlGeoJSON({ data }) {
  const map = useMap();

  if (data && data.features && data.features.length > 0) {
    const geojsonLayer = new L.GeoJSON(data);
    const bounds = geojsonLayer.getBounds();
    map.fitBounds(bounds, { padding: [20, 20] });
  }

  return null;
}

export default function MapaEspacios({
  geoData,
  plantaSeleccionada,
  onSeleccionarEspacio,
}) {
  // APLICAMOS FILTRO DE PLANTA A geoData
  const featuresFiltradas = geoData
    ? {
        ...geoData,
        features: geoData.features.filter((feature) => {
          const props = feature.properties || {};
          const rawPlanta =
            props.planta ??
            props.PLANTA ??
            props.Altura ??
            props.altura ??
            null;

          // sin filtro -> todas
          if (plantaSeleccionada === "" || plantaSeleccionada === null) {
            return true;
          }

          return String(rawPlanta) === String(plantaSeleccionada);
        }),
      }
    : null;

  const style = (feature) => ({
    color: colorPorUso(feature.properties?.uso),
    weight: 2,
    fillOpacity: 0.6,
  });

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const titulo = props.nombre || props.id_espacio || "Espacio";
    const uso = props.uso || "Sin uso";
    const planta = props.planta || "Sin planta";
    const aforo = props.aforo ?? "N/D";
    const reservable = props.reservable ? "Sí" : "No";

    layer.bindPopup(`
      <div>
        <strong>${titulo}</strong><br/>
        ID: ${props.id_espacio || "N/D"}<br/>
        Uso: ${uso}<br/>
        Planta: ${planta}<br/>
        Aforo: ${aforo}<br/>
        Reservable: ${reservable}
      </div>
    `);

    layer.on("click", () => {
      onSeleccionarEspacio?.(props);
    });
  };

  return (
    <MapContainer
      center={[41.683, -0.89]}
      zoom={18}
      style={{ height: "520px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {featuresFiltradas && (
        <>
          {/* Forzamos a React-Leaflet a recrear la capa al cambiar de planta */}
          <GeoJSON
            key={plantaSeleccionada || "todas"}
            data={featuresFiltradas}
            style={style}
            onEachFeature={onEachFeature}
          />
          <AjustarAlGeoJSON data={featuresFiltradas} />
        </>
      )}
    </MapContainer>
  );
}