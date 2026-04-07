const API_BASE_URL = "http://localhost:3000/api";

export async function loginRequest(email, password) {
  const resp = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.message || `Error ${resp.status}`);
  }

  return await resp.json();
}