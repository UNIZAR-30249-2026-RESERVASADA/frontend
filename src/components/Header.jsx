import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiChevronDown, FiCalendar, FiSettings, FiUsers, FiList, FiBell } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { getNotificaciones, marcarTodasLeidas } from "../services/notificacionesService";
import unizarLogo from "../assets/images/unizar.png";
import "./Header.css";

export default function Header({ backLink }) {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [mostrarMenu,           setMostrarMenu]           = useState(false);
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

  const handleLogout = () => { logout(); navigate("/login"); };

  const IconoMotivo = ({ motivo }) => {
    const base = { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
    if (motivo === "eliminada_por_gerente") return (
      <div style={{ ...base, background: "#fee2e2" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </div>
    );
    if (motivo === "espacio_no_reservable") return (
      <div style={{ ...base, background: "#fff7ed" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      </div>
    );
    if (motivo === "porcentaje_ocupacion") return (
      <div style={{ ...base, background: "#eff6ff" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
    );
    if (motivo === "horario") return (
      <div style={{ ...base, background: "#f5f3ff" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
    );
    if (motivo === "politica") return (
      <div style={{ ...base, background: "#f0fdf4" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
    );
    return (
      <div style={{ ...base, background: "#f1f5f9" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
    );
  };

  const textoMotivoBonito = (motivo) => {
    const textos = {
      eliminada_por_gerente: "El gerente ha cancelado tu reserva",
      espacio_no_reservable: "El espacio ya no está disponible para reservas",
      porcentaje_ocupacion:  "El aforo máximo ha cambiado y tu reserva supera el nuevo límite",
      horario:               "El horario del espacio ha cambiado y tu reserva queda fuera de él",
      politica:              "El gerente ha modificado el espacio y ya no puedes reservarlo",
    };
    return textos[motivo] || motivo;
  };

  const formatFecha = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <header className="hdr-topbar">
      <div className="hdr-left">
        <img src={unizarLogo} alt="Universidad Zaragoza" className="hdr-logo" />
        <div>
          <h1 className="hdr-title">ByronSpace</h1>
          <p className="hdr-subtitle">Sistema de Reservas · Ada Byron</p>
        </div>
      </div>

      <div className="hdr-right">
        {backLink && (
          <button className="hdr-nav-btn" onClick={() => navigate(backLink.to)}>
            {backLink.label}
          </button>
        )}

        {!usuario?.esGerente && (
          <button className="hdr-nav-btn" onClick={() => navigate("/mis-reservas")}>
            Mis reservas
          </button>
        )}

        {usuario?.esGerente && (
          <div style={{ position: "relative" }}>
            <button
              className="hdr-nav-btn hdr-nav-btn--gerente"
              onClick={() => { setMostrarMenu(!mostrarMenu); setMostrarNotificaciones(false); }}
            >
              Panel gerente
              <FiChevronDown size={13} style={{ marginLeft: 4, transition: "transform 0.2s", transform: mostrarMenu ? "rotate(180deg)" : "none" }} />
            </button>
            {mostrarMenu && (
              <div className="hdr-dropdown" onClick={() => setMostrarMenu(false)}>
                <button className="hdr-dropdown-item" onClick={() => navigate("/mis-reservas")}><FiCalendar size={14} /> Mis reservas</button>
                <button className="hdr-dropdown-item" onClick={() => navigate("/gerencia/reservas")}><FiList size={14} /> Reservas vivas</button>
                <button className="hdr-dropdown-item" onClick={() => navigate("/gerencia/espacios")}><FiSettings size={14} /> Gestión de espacios</button>
                <button className="hdr-dropdown-item" onClick={() => navigate("/gerencia/usuarios")}><FiUsers size={14} /> Gestión de usuarios</button>
                <div className="hdr-dropdown-divider" />
                <button className="hdr-dropdown-item hdr-dropdown-item--danger" onClick={handleLogout}><FiLogOut size={14} /> Cerrar sesión</button>
              </div>
            )}
          </div>
        )}

        {/* Campana */}
        <div className="hdr-notif-wrap" ref={notifRef}>
          <button className="hdr-notif-btn" onClick={handleAbrirNotificaciones} title="Notificaciones">
            <FiBell size={18} />
            {noLeidas > 0 && <span className="hdr-notif-badge">{noLeidas > 9 ? "9+" : noLeidas}</span>}
          </button>

          {mostrarNotificaciones && (
            <div className="hdr-notif-panel">
              <div className="hdr-notif-header">
                <span className="hdr-notif-title">Notificaciones</span>
                {notificaciones.length > 0 && <span className="hdr-notif-count">{notificaciones.length}</span>}
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
                      <IconoMotivo motivo={n.motivo} />
                      <div className="hdr-notif-body">
                        <span className="hdr-notif-texto">{textoMotivoBonito(n.motivo)}</span>

                        {n.reserva?.espacios?.length > 0 && (
                          <span className="hdr-notif-espacios">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline", marginRight:4, verticalAlign:"middle" }}>
                              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {n.reserva.espacios.join(", ")}
                          </span>
                        )}

                        {n.reserva?.fecha && (
                          <span className="hdr-notif-desc">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline", marginRight:4, verticalAlign:"middle" }}>
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            {n.reserva.fecha} a las {n.reserva.horaInicio}
                          </span>
                        )}

                        <div className="hdr-notif-footer">
                          <span className="hdr-notif-fecha">{formatFecha(n.fechaCreacion)}</span>
                          <button className="hdr-notif-link" onClick={() => { setMostrarNotificaciones(false); navigate("/mis-reservas"); }}>
                            Ver mis reservas →
                          </button>
                        </div>
                      </div>
                      {!n.leida && <span className="hdr-notif-dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hdr-user">
          <div className="hdr-user-details">
            <span className="hdr-user-name">{usuario?.nombre || "Usuario"}</span>
            <span className="hdr-user-role">{usuario?.esGerente ? "Gerente" : usuario?.rol || "Sin rol"}</span>
          </div>
          <div className="hdr-user-circle">{(usuario?.nombre || "U").charAt(0).toUpperCase()}</div>
        </div>

        {!usuario?.esGerente && (
          <button className="hdr-logout" onClick={handleLogout} title="Cerrar sesión">
            <FiLogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}