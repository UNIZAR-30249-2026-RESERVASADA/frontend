import { useEffect, useState } from "react";
import { obtenerEspacios } from "../services/geoService";
import { obtenerMetadatosEspacios } from "../services/espaciosBackendService";

export function useEspaciosGeo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);

        const [geojson, metadatos] = await Promise.all([
          obtenerEspacios(),
          obtenerMetadatosEspacios(),
        ]);

        const metadatosPorId = {};
        for (const item of metadatos) {
          metadatosPorId[item.id_espacio] = item;
        }

        const featuresEnriquecidas = geojson.features.map((feature) => {
          const props = feature.properties || {};
          const id    = props.id_espacio || props.ID_ESPACIO;
          const meta  = metadatosPorId[id] || {};

          return {
            ...feature,
            properties: {
              ...props,
              categoria:               meta.categoria               ?? null,
              reservable:              meta.reservable              ?? false,
              aforo:                   meta.aforo                   ?? null,
              departamentoId:          meta.departamentoId          ?? null,
              asignadoAEina:           meta.asignadoAEina           ?? false,
              usuariosAsignados:       meta.usuariosAsignados       ?? [],
              gid:                     meta.gid                     ?? props.gid ?? null,
              uso:                     meta.uso                     ?? null,
              horarioApertura:         meta.horarioApertura         ?? null,
              horarioCierre:           meta.horarioCierre           ?? null,
              edificioNombre:          meta.edificioNombre          ?? null,
              edificioHorarioApertura: meta.edificioHorarioApertura ?? null,
              edificioHorarioCierre:   meta.edificioHorarioCierre   ?? null,
            },
          };
        });

        setData({
          ...geojson,
          features: featuresEnriquecidas,
          numberReturned: featuresEnriquecidas.length,
        });
      } catch (err) {
        setError(err.message || "Error cargando espacios");
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, []);

  return { data, loading, error };
}