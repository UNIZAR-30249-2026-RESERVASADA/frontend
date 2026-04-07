import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import React, { useEffect } from "react";
import { colorPorCategoria } from "../utils/coloresEspacio";

function AjustarAlGeoJSON({ data }) {
  const map = useMap();

  if (data && data.features && data.features.length > 0) {
    const geojsonLayer = new L.GeoJSON(data);
    const bounds = geojsonLayer.getBounds();
    map.fitBounds(bounds, { padding: [20, 20] });
  }

  return null;
}

function CentrarEnEspacio({ espacioSeleccionado, featuresFiltradas, layersRef }) {
  const map = useMap();

  React.useEffect(() => {
    if (espacioSeleccionado && map && featuresFiltradas) {
      const id    = espacioSeleccionado.id_espacio || espacioSeleccionado.gid;
      const layer = layersRef.current[id];

      if (layer && featuresFiltradas.features) {
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
          if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
        }

        setTimeout(() => layer.openPopup(), 300);
      }
    } else if (!espacioSeleccionado && map) {
      map.closePopup();
    }
  }, [espacioSeleccionado, featuresFiltradas, map, layersRef]);

  return null;
}

export default function MapaEspacios({
  geoData,
  plantaSeleccionada,
  onSeleccionarEspacio,
  espacioSeleccionado,
}) {
  const featuresFiltradas = geoData || null;
  const layersRef = React.useRef({});

  const style = (feature) => ({
    color:       colorPorCategoria(feature.properties?.categoria),
    weight:      2,
    fillOpacity: 0.6,
  });

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const id    = props.id_espacio || props.gid;

    layersRef.current[id] = layer;

    const titulo     = props.nombre || props.id_espacio || "Espacio";
    const uso        = props.uso        || "Sin uso";
    const categoria  = props.categoria  || "Sin categoría";
    const planta     = props.planta     || "Sin planta";
    const aforo      = props.aforo      ?? "N/D";
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

    layer.on("click", () => {
      if (layersRef.current.selectedLayerId === id) {
        onSeleccionarEspacio?.(null);
        layer.closePopup();
        layersRef.current.selectedLayerId = null;
      } else {
        onSeleccionarEspacio?.(props);
        layersRef.current.selectedLayerId = id;
        setTimeout(() => layer.openPopup(), 0);
      }
    });
  };

  const geoKey =
    featuresFiltradas?.features
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