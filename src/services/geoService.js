const GEO_BASE_URL = "http://localhost:3000/api/geo";

/**
 * Obtiene los espacios geográficos del edificio Ada Byron.
 * Llama al gateway (N2) que hace de proxy hacia PyGeoAPI (N3).
 * El frontend nunca accede directamente a PyGeoAPI.
 */
export async function obtenerEspacios() {
  let url = `${GEO_BASE_URL}/espacios?f=json&limit=1000`;
  let todasLasFeatures = [];
  let primeraRespuesta = null;

  while (url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("No se pudieron cargar los espacios geográficos");
    }

    const data = await response.json();

    if (!primeraRespuesta) {
      primeraRespuesta = data;
    }

    if (data.features && Array.isArray(data.features)) {
      todasLasFeatures = todasLasFeatures.concat(data.features);
    }

    const nextLink = data.links?.find((link) => link.rel === "next");
    url = nextLink ? nextLink.href : null;
  }

  return {
    ...primeraRespuesta,
    features: todasLasFeatures,
    numberReturned: todasLasFeatures.length,
  };
}