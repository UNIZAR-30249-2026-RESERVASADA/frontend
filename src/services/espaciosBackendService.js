const API_BASE_URL = "http://localhost:3000/api";

export async function obtenerMetadatosEspacios() {
  const response = await fetch(`${API_BASE_URL}/espacios/metadatos`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los metadatos de espacios desde el backend");
  }

  return await response.json();
}