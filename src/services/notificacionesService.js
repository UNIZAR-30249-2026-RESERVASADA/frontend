const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

export async function getNotificaciones() {
  const response = await fetch(`${API_BASE_URL}/api/notificaciones`, {
    headers: { "Authorization": `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error("Error obteniendo notificaciones");
  return await response.json();
}

export async function marcarTodasLeidas() {
  const response = await fetch(`${API_BASE_URL}/api/notificaciones/leidas`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error("Error marcando notificaciones como leídas");
  return await response.json();
}