const API_BASE_URL = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function obtenerMetadatosEspacios() {
  const response = await fetch(`${API_BASE_URL}/espacios/metadatos`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar los metadatos de espacios desde el backend");
  }
  return await response.json();
}

export async function modificarEdificio(edificioId, cambios, afectarTodos = false) {
  const response = await fetch(`${API_BASE_URL}/edificio/${edificioId}?afectarTodos=${afectarTodos}`, {
    method: "PATCH",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${getToken()}`,
    },
    body: JSON.stringify(cambios),
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || "Error modificando el edificio");
  }
  return await response.json();
}

export async function modificarEspacio(espacioId, cambios) {
  const response = await fetch(`${API_BASE_URL}/espacios/${espacioId}`, {
    method: "PATCH",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${getToken()}`,
    },
    body: JSON.stringify(cambios),
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || "Error modificando el espacio");
  }
  return await response.json();
}