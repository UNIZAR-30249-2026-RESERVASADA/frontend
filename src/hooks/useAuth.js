import { useState, useEffect } from "react";

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  // Al montar, intenta recuperar usuario del localStorage
  useEffect(() => {
    console.log("useAuth: montando, leyendo localStorage");
    const usuarioGuardado = localStorage.getItem("usuario");
    console.log("useAuth: usuarioGuardado:", usuarioGuardado);
    if (usuarioGuardado) {
      try {
        const parsed = JSON.parse(usuarioGuardado);
        console.log("useAuth: usuario parseado:", parsed);
        setUsuario(parsed);
      } catch (err) {
        console.error("useAuth: Error al parsear usuario guardado:", err);
        localStorage.removeItem("usuario");
      }
    }
    setLoading(false);
  }, []);const login = async (email, password) => {
    try {
      console.log("useAuth.login: enviando", { email, password });
      const resp = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("useAuth.login: status", resp.status);

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        console.error("useAuth.login: error response", errBody);
        throw new Error(errBody.message || `Error ${resp.status}`);
      }

      const usuarioData = await resp.json();
      console.log("useAuth.login: usuario recibido", usuarioData);
      
      // Guardar primero en localStorage, luego en estado
      localStorage.setItem("usuario", JSON.stringify(usuarioData));
      setUsuario(usuarioData);

      console.log("useAuth.login: usuario guardado en estado y localStorage");
      return usuarioData;
    } catch (err) {
      console.error("useAuth.login: catch error", err);
      throw err;
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario");
  };

  return { usuario, loading, login, logout };
}
