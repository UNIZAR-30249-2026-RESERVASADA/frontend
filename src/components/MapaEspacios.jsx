import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import React, { useEffect } from "react";

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

function AjustarAlGeoJSON({ data }) {
  const map = useMap();

  if (data && data.features && data.features.length > 0) {
    const geojsonLayer = new L.GeoJSON(data);
    const bounds = geojsonLayer.getBounds();
    map.fitBounds(bounds, { padding: [20, 20] });
  }

  return null;
}

// Nuevo componente para centrar y abrir popup
function CentrarEnEspacio({ espacioSeleccionado, featuresFiltradas, layersRef }) {
  const map = useMap();
  React.useEffect(() => {
    if (espacioSeleccionado && map && featuresFiltradas) {
      const id = espacioSeleccionado.id_espacio || espacioSeleccionado.gid;
      const layer = layersRef.current[id];

      if (layer && featuresFiltradas.features) {
        // Buscar el feature para obtener sus coordenadas
        const feature = featuresFiltradas.features.find(
          (f) => (f.properties?.id_espacio || f.properties?.gid) === id
        );

        if (feature && feature.geometry) {
          let bounds;
          if (feature.geometry.type === "Polygon") {
            bounds = L.latLngBounds(
              feature.geometry.coordinates[0].map((coord) => [coord[1], coord[0]])
            );
          } else if (feature.geometry.type === "Point") {
            bounds = L.latLngBounds([
              [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
            ]);
          }

          if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }

        // Abrir el popup
        setTimeout(() => {
          layer.openPopup();
        }, 300);
      }
    } else if (!espacioSeleccionado && map) {
      // Si se deselecciona, cerrar todos los popups
      map.closePopup();
    }
  }, [espacioSeleccionado, featuresFiltradas, map, layersRef]);

  return null;
}

export default function MapaEspacios({
  geoData,
  plantaSeleccionada, // solo para el título del mapa si quieres, NO filtramos aquí
  onSeleccionarEspacio,
  espacioSeleccionado, // nuevo prop para detectar cambios
}) {

  // IMPORTANTE: geoData YA viene filtrado desde HomePage (planta + texto + categoría)
  const featuresFiltradas = geoData || null;
  const mapRef = React.useRef(null);
  const layersRef = React.useRef({});
  const style = (feature) => ({
    color: colorPorCategoria(feature.properties?.categoria),
    weight: 2,
    fillOpacity: 0.6,
  });  
  
  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const id = props.id_espacio || props.gid;
    
    // Guardar referencia del layer por ID para poder abrirlo después
    layersRef.current[id] = layer;

    const titulo = props.nombre || props.id_espacio || "Espacio";
    const uso = props.uso || "Sin uso";
    const categoria = props.categoria || "Sin categoría";
    const planta = props.planta || "Sin planta";
    const aforo = props.aforo ?? "N/D";
    const reservable = props.reservable ? "Sí" : "No";

    layer.bindPopup(`
      <div style="font-family: Arial; font-size: 13px;">
        <strong>${titulo}</strong><br/>
        ID: ${props.id_espacio || "N/D"}<br/>
        Uso: ${uso}<br/>
        Categoría: ${categoria}<br/>
        Planta: ${planta}<br/>
        Aforo: ${aforo}<br/>
        Reservable: ${reservable}
      </div>
    `);    
    
    layer.on("click", (e) => {
      // Comprobar si ya está seleccionado
      if (layersRef.current.selectedLayerId === (props.id_espacio || props.gid)) {
        // Si ya está seleccionado, deseleccionar
        onSeleccionarEspacio?.(null);
        layer.closePopup();
        layersRef.current.selectedLayerId = null;
      } else {
        // Si no está seleccionado, seleccionar
        onSeleccionarEspacio?.(props);
        layersRef.current.selectedLayerId = props.id_espacio || props.gid;
        setTimeout(() => layer.openPopup(), 0);
      }
    });
  };
  
  // key hace que el GeoJSON se recree cuando cambian las features filtradas
  const geoKey =
    featuresFiltradas && featuresFiltradas.features
      ? featuresFiltradas.features
          .map((f) => f.properties?.id_espacio || f.properties?.gid)
          .join("|")
      : "0";

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
          <GeoJSON
            key={geoKey}
            data={featuresFiltradas}
            style={style}
            onEachFeature={onEachFeature}
          />
          <AjustarAlGeoJSON data={featuresFiltradas} />
          <CentrarEnEspacio 
            espacioSeleccionado={espacioSeleccionado}
            featuresFiltradas={featuresFiltradas}
            layersRef={layersRef}
          />
        </>
      )}
    </MapContainer>
  );
}