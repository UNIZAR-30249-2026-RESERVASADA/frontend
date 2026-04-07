import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiCalendar, FiClock, FiUsers, FiMapPin } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { getMisReservas, cancelarReserva } from "../../services/reservasService";
import { obtenerMetadatosEspacios } from "../../services/espaciosBackendService";
import { colorIconPorCategoria } from "../../utils/coloresEspacio";
import unizarLogo from "../../assets/images/unizar.png";
import "./ReservasPage.css";

const ESTADO_COLORES = {
  aceptada:   { bg: "#dcfce7", text: "#166534", label: "Activa" },
  cancelada:  { bg: "#fee2e2", text: "#991b1b", label: "Cancelada" },
  finalizada: { bg: "#f3f4f6", text: "#6b7280", label: "Finalizada" },
  rechazada:  { bg: "#fef3c7", text: "#92400e", label: "Rechazada" },
};

const FILTROS = ["todas", "aceptada", "cancelada", "finalizada"];

export default function ReservasPage() {
  const navigate            = useNavigate();
  const { usuario, logout } = useAuth();
  const [reservas,   setReservas]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [filtro,     setFiltro]     = useState("todas");
  const [cancelando, setCancelando] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const [data, metadatos] = await Promise.all([
          getMisReservas(),
          obtenerMetadatosEspacios(),
        ]);

        console.log("Primera reserva espacioId:", data[0]?.espacioId, typeof data[0]?.espacioId);
        console.log("Primer metadato gid:", metadatos[0]?.gid, typeof metadatos[0]?.gid);
        console.log("Metadato con ese gid:", metadatos.find(m => Number(m.gid) === Number(data[0]?.espacioId)));

        const metadatosPorGid = {};
        for (const m of metadatos) {
          metadatosPorGid[Number(m.gid)] = m;
        }

        const reservasEnriquecidas = data.map((r) => ({
          ...r,
          espacioNombre:    metadatosPorGid[Number(r.espacioId)]?.nombre    ?? `Espacio #${r.espacioId}`,
          espacioCategoria: metadatosPorGid[Number(r.espacioId)]?.categoria ?? null,
          espacioPlanta:    metadatosPorGid[Number(r.espacioId)]?.planta    ?? null,
        }));

        setReservas(reservasEnriquecidas);
      } catch (err) {
        setError(err.message || "Error cargando reservas");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const handleCancelar = async (reservaId) => {
    if (!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return;
    setCancelando(reservaId);
    try {
      await cancelarReserva(reservaId);
      setReservas((prev) =>
        prev.map((r) => r.id === reservaId ? { ...r, estado: "cancelada" } : r)
      );
    } catch (err) {
      alert(err.message || "Error cancelando la reserva");
    } finally {
      setCancelando(null);
    }
  };

  const reservasFiltradas = filtro === "todas"
    ? reservas
    : reservas.filter((r) => r.estado === filtro);

  const contadores = {
    aceptada:   reservas.filter((r) => r.estado === "aceptada").length,
    cancelada:  reservas.filter((r) => r.estado === "cancelada").length,
    finalizada: reservas.filter((r) => r.estado === "finalizada").length,
  };

  return (
    <div className="reservas-root">
      <header className="reservas-topbar">
        <div className="reservas-topbar-left">
          <img src={unizarLogo} alt="Universidad Zaragoza" className="reservas-logo-img" />
          <div>
            <h1 className="reservas-app-title">ByronSpace</h1>
            <p className="reservas-app-subtitle">Sistema de Reservas · Ada Byron</p>
          </div>
        </div>
        <div className="reservas-topbar-right">
          <button className="reservas-topbar-link" onClick={() => navigate("/")}>
            Volver al mapa
          </button>
          <div className="reservas-user-info">
            <div className="reservas-user-details">
              <div className="reservas-user-name">{usuario?.nombre || "Usuario"}</div>
              <div className="reservas-user-role">{usuario?.rol || "Sin rol"}</div>
            </div>
            <div className="reservas-user-circle">
              {(usuario?.nombre || "U").charAt(0).toUpperCase()}
            </div>
          </div>
          <button
            className="reservas-topbar-logout"
            onClick={() => { logout(); navigate("/login"); }}
            title="Cerrar sesión"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      <main className="reservas-main">
        <div className="reservas-header">
          <h2 className="reservas-title">Mis Reservas</h2>
          <p className="reservas-subtitle">Gestiona y consulta todas tus reservas de espacios</p>
        </div>

        <div className="reservas-contadores">
          {[
            { label: "Activas",     count: contadores.aceptada,   color: "#16a34a" },
            { label: "Finalizadas", count: contadores.finalizada,  color: "#6b7280" },
            { label: "Canceladas",  count: contadores.cancelada,   color: "#dc2626" },
          ].map(({ label, count, color }) => (
            <div key={label} className="reservas-contador-card">
              <p className="reservas-contador-num" style={{ color }}>{count}</p>
              <p className="reservas-contador-label">{label}</p>
            </div>
          ))}
        </div>

        <div className="reservas-filtros">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`reservas-filtro-btn${filtro === f ? " reservas-filtro-btn--active" : ""}`}
            >
              {f === "todas" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading && <div className="reservas-loading">Cargando reservas...</div>}
        {error   && <div className="reservas-error">{error}</div>}

        {!loading && !error && reservasFiltradas.length === 0 && (
          <div className="reservas-empty">
            No tienes reservas{filtro !== "todas" ? ` con estado "${filtro}"` : ""}.
          </div>
        )}

        <div className="reservas-list">
          {reservasFiltradas.map((reserva) => {
            const estadoInfo = ESTADO_COLORES[reserva.estado] || { bg: "#f3f4f6", text: "#6b7280", label: reserva.estado };
            const colorIcon = colorIconPorCategoria(reserva.espacioCategoria);
            return (
              <div key={reserva.id} className="reservas-item-card">
                <div className="reservas-item-left">
                  <div className="reservas-item-icon" style={{ background: colorIcon.bg, color: colorIcon.text }}>
                    <FiMapPin size={18} />
                  </div>
                  <div className="reservas-item-info">
                    <p className="reservas-item-nombre">{reserva.espacioNombre || `Espacio #${reserva.espacioId}`}</p>
                    <div className="reservas-item-meta">
                      <span className="reservas-item-meta-item">
                        <FiCalendar size={12} /> {reserva.fecha}
                      </span>
                      <span className="reservas-item-meta-item">
                        <FiClock size={12} /> {reserva.horaInicio} — {reserva.horaFin}
                      </span>
                      {reserva.numPersonas && (
                        <span className="reservas-item-meta-item">
                          <FiUsers size={12} /> {reserva.numPersonas} personas
                        </span>
                      )}
                      {reserva.tipoUso && (
                        <span className="reservas-item-meta-item" style={{ textTransform: "capitalize" }}>
                          {reserva.tipoUso}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="reservas-item-right">
                  <span
                    className="reservas-item-badge"
                    style={{ background: estadoInfo.bg, color: estadoInfo.text }}
                  >
                    {estadoInfo.label}
                  </span>
                  {reserva.estado === "aceptada" && (
                    <button
                      className="reservas-item-cancelar"
                      onClick={() => handleCancelar(reserva.id)}
                      disabled={cancelando === reserva.id}
                    >
                      {cancelando === reserva.id ? "Cancelando..." : "Cancelar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}