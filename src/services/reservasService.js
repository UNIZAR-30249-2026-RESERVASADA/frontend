const API_BASE_URL = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function crearReserva(payload) {
  const resp = await fetch(`${API_BASE_URL}/reservas`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.message || "No se pudo crear la reserva");
  }

  return await resp.json();
}

export async function getMisReservas() {
  const resp = await fetch(`${API_BASE_URL}/reservas/mis-reservas`, {
    headers: { "Authorization": `Bearer ${getToken()}` },
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.message || "Error obteniendo reservas");
  }

  return await resp.json();
}

export async function cancelarReserva(reservaId) {
  const resp = await fetch(`${API_BASE_URL}/reservas/${reservaId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${getToken()}` },
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.message || "Error cancelando la reserva");
  }

  return await resp.json();
}