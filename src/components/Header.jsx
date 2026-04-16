import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiChevronDown, FiCalendar, FiSettings, FiUsers, FiList } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import unizarLogo from "../assets/images/unizar.png";
import "./Header.css";

/**
 * Header reutilizable para todas las páginas.
 * Props:
 * - backLink: { label, to } — botón de navegación extra (ej. "← Volver al mapa")
 */
export default function Header({ backLink }) {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [mostrarMenu, setMostrarMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="hdr-topbar">
      {/* IZQUIERDA */}
      <div className="hdr-left">
        <img src={unizarLogo} alt="Universidad Zaragoza" className="hdr-logo" />
        <div>
          <h1 className="hdr-title">ByronSpace</h1>
          <p className="hdr-subtitle">Sistema de Reservas · Ada Byron</p>
        </div>
      </div>

      {/* DERECHA */}
      <div className="hdr-right">
        {/* Botón de navegación opcional */}
        {backLink && (
          <button className="hdr-nav-btn" onClick={() => navigate(backLink.to)}>
            {backLink.label}
          </button>
        )}

        {/* Usuarios normales — solo mis reservas */}
        {!usuario?.esGerente && (
          <button className="hdr-nav-btn" onClick={() => navigate("/mis-reservas")}>
            Mis reservas
          </button>
        )}

        {/* Gerente — menú desplegable */}
        {usuario?.esGerente && (
          <div style={{ position: "relative" }}>
            <button
              className="hdr-nav-btn hdr-nav-btn--gerente"
              onClick={() => setMostrarMenu(!mostrarMenu)}
            >
              Panel gerente
              <FiChevronDown
                size={13}
                style={{
                  marginLeft: 4,
                  transition: "transform 0.2s",
                  transform: mostrarMenu ? "rotate(180deg)" : "none",
                }}
              />
            </button>

            {mostrarMenu && (
              <div className="hdr-dropdown" onClick={() => setMostrarMenu(false)}>
                <button className="hdr-dropdown-item" onClick={() => navigate("/mis-reservas")}>
                  <FiCalendar size={14} /> Mis reservas
                </button>
                <button className="hdr-dropdown-item" onClick={() => navigate("/gerencia/reservas")}>
                  <FiList size={14} /> Reservas vivas
                </button>
                <button className="hdr-dropdown-item" onClick={() => navigate("/gerencia/espacios")}>
                  <FiSettings size={14} /> Gestión de espacios
                </button>
                <button className="hdr-dropdown-item" onClick={() => navigate("/gerencia/usuarios")}>
                  <FiUsers size={14} /> Gestión de usuarios
                </button>
                <div className="hdr-dropdown-divider" />
                <button className="hdr-dropdown-item hdr-dropdown-item--danger" onClick={handleLogout}>
                  <FiLogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info usuario */}
        <div className="hdr-user">
          <div className="hdr-user-details">
            <span className="hdr-user-name">{usuario?.nombre || "Usuario"}</span>
            <span className="hdr-user-role">
              {usuario?.esGerente ? "Gerente" : usuario?.rol || "Sin rol"}
            </span>
          </div>
          <div className="hdr-user-circle">
            {(usuario?.nombre || "U").charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Logout solo para usuarios normales */}
        {!usuario?.esGerente && (
          <button className="hdr-logout" onClick={handleLogout} title="Cerrar sesión">
            <FiLogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}