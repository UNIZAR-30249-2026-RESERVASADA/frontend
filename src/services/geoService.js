const GEO_BASE_URL = "http://localhost:5000";

export async function obtenerEspacios() {
  let url = `${GEO_BASE_URL}/collections/espacios/items?f=json&limit=1000`;
  let todasLasFeatures = [];
  let primeraRespuesta = null;

  while (url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("No se pudieron cargar los espacios desde PyGeoAPI");
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