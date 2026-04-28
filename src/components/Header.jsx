import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiChevronDown, FiCalendar, FiSettings, FiUsers, FiList, FiBell } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { getNotificaciones, marcarTodasLeidas } from "../services/notificacionesService";
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
  const [mostrarMenu,          setMostrarMenu]          = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [notificaciones,        setNotificaciones]        = useState([]);
  const notifRef = useRef(null);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  useEffect(() => {
    if (!usuario) return;
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(intervalo);
  }, [usuario]);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setMostrarNotificaciones(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function cargarNotificaciones() {
    try {
      const data = await getNotificaciones();
      setNotificaciones(data);
    } catch (_) {}
  }

  async function handleAbrirNotificaciones() {
    setMostrarMenu(false);
    setMostrarNotificaciones(prev => !prev);
    if (!mostrarNotificaciones && noLeidas > 0) {
      try {
        await marcarTodasLeidas();
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      } catch (_) {}
    }
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const iconoMotivo = (motivo) => {
    const iconos = {
      eliminada_por_gerente: "🗑️",
      espacio_no_reservable: "🚫",
      porcentaje_ocupacion:  "👥",
      horario:               "🕐",
      politica:              "🔒",
    };
    return iconos[motivo] || "🔔";
  };

  const formatFecha = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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
              onClick={() => { setMostrarMenu(!mostrarMenu); setMostrarNotificaciones(false); }}
            >
              Panel gerente
              <FiChevronDown
                size={13}
                style={{ marginLeft: 4, transition: "transform 0.2s", transform: mostrarMenu ? "rotate(180deg)" : "none" }}
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

        {/* Campana de notificaciones */}
        <div className="hdr-notif-wrap" ref={notifRef}>
          <button
            className="hdr-notif-btn"
            onClick={handleAbrirNotificaciones}
            title="Notificaciones"
          >
            <FiBell size={18} />
            {noLeidas > 0 && (
              <span className="hdr-notif-badge">{noLeidas > 9 ? "9+" : noLeidas}</span>
            )}
          </button>

          {mostrarNotificaciones && (
            <div className="hdr-notif-panel">
              <div className="hdr-notif-header">
                <span className="hdr-notif-title">Notificaciones</span>
                {notificaciones.length > 0 && (
                  <span className="hdr-notif-count">{notificaciones.length}</span>
                )}
              </div>
              <div className="hdr-notif-list">
                {notificaciones.length === 0 ? (
                  <div className="hdr-notif-empty">
                    <FiBell size={24} style={{ opacity: 0.2 }} />
                    <span>No tienes notificaciones</span>
                  </div>
                ) : (
                  notificaciones.map(n => (
                    <div key={n.id} className={`hdr-notif-item${n.leida ? "" : " hdr-notif-item--unread"}`}>
                      <span className="hdr-notif-icon">{iconoMotivo(n.motivo)}</span>
                      <div className="hdr-notif-body">
                        <span className="hdr-notif-texto">{n.textoMotivo}</span>
                        {n.descripcion && (
                          <span className="hdr-notif-desc">{n.descripcion}</span>
                        )}
                        <span className="hdr-notif-fecha">{formatFecha(n.fechaCreacion)}</span>
                      </div>
                      {!n.leida && <span className="hdr-notif-dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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