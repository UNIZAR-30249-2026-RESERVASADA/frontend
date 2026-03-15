import { useEffect, useState } from "react";
import { obtenerEspacios } from "../services/geoService";

export function useEspaciosGeo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const geojson = await obtenerEspacios();
        setData(geojson);
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