import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import unizarLogo from "../../assets/images/unizar.png";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Error en login");
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo-box">
            <div className="login-university-logo">
              <img src={unizarLogo} alt="Universidad Zaragoza" />
            </div>
          </div>

          <h1 className="login-title">ByronSpace</h1>
          <p className="login-subtitle">Sistema de Reservas Universitarias del Ada Byron</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="login-input-wrapper">
                <FiMail className="login-input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="usuario@unizar.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="login-input-wrapper">
                <FiLock className="login-input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              type="submit"
              className="login-btn"
              disabled={loading || !email || !password}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2026 Universidad · Soporte técnico disponible 24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
}