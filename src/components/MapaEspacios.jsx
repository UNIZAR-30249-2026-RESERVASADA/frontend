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
    const aforoBruto    = props.aforo ?? null;
    const pct           = Number(props.porcentajeOcupacion ?? props.edificioPorcentaje ?? 100);
    const aforoEfectivo = aforoBruto !== null ? Math.floor(aforoBruto * pct / 100) : null;
    const colorCat      = colorPorCategoria(categoria);
    const aforoStr      = aforoBruto === null ? "N/D"
      : pct < 100
        ? `<span style="text-decoration:line-through;color:#9ca3af;">${aforoBruto}</span> <span style="color:${colorCat};font-weight:600;">${aforoEfectivo} máx. (${pct}%)</span>`
        : `${aforoBruto} personas`;
    const reservable = props.reservable ? "Sí" : "No";

    // Horario efectivo — propio del espacio o heredado del edificio
    const horApertura = props.horarioApertura || props.edificioHorarioApertura || null;
    const horCierre   = props.horarioCierre   || props.edificioHorarioCierre   || null;
    const horarioStr  = horApertura && horCierre
      ? `${horApertura} – ${horCierre}${props.horarioApertura ? " <span style=\"background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;font-size:10px;\">Propio</span>" : ""}`
      : "No definido";

    layer.bindPopup(`
      <div style="font-family: system-ui, Arial; font-size: 13px; min-width: 180px;">
        <div style="font-weight:700; font-size:14px; margin-bottom:8px; border-bottom:1px solid #e5e7eb; padding-bottom:6px;">
          ${titulo}
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <div><span style="color:#6b7280; font-size:11px;">ID</span><br/>${props.id_espacio || "N/D"}</div>
          <div><span style="color:#6b7280; font-size:11px;">USO FÍSICO</span><br/>${uso}</div>
          <div><span style="color:#6b7280; font-size:11px;">CATEGORÍA</span><br/>${categoria}</div>
          <div><span style="color:#6b7280; font-size:11px;">PLANTA</span><br/>P${planta}</div>
          <div><span style="color:#6b7280; font-size:11px;">AFORO</span><br/>${aforoStr}</div>
          <div><span style="color:#6b7280; font-size:11px;">HORARIO</span><br/>${horarioStr}</div>
          <div><span style="color:#6b7280; font-size:11px;">RESERVABLE</span><br/>
            <span style="color:${props.reservable ? "#16a34a" : "#dc2626"}; font-weight:600;">
              ${reservable}
            </span>
          </div>
        </div>
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