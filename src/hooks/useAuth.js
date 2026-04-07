import { useState, useEffect } from "react";
import { loginRequest } from "../services/authService";

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    const tokenGuardado   = localStorage.getItem("token");

    if (usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.removeItem("usuario");
      }
    }

    if (tokenGuardado) setToken(tokenGuardado);

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);

    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    localStorage.setItem("token", data.token);

    setUsuario(data.usuario);
    setToken(data.token);

    return data.usuario;
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
  };

  return { usuario, token, loading, login, logout };
}