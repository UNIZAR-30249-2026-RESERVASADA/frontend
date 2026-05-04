import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiUsers, FiMapPin, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { getMisReservas, cancelarReserva } from "../../services/reservasService";
import { obtenerMetadatosEspacios } from "../../services/espaciosBackendService";
import { colorIconPorCategoria } from "../../utils/coloresEspacio";
import Header from "../../components/Header";
import "./ReservasPage.css";

const ESTADO_COLORES = {
  aceptada:   { bg: "#dcfce7", text: "#166534", label: "Activa",     dot: "#16a34a" },
  cancelada:  { bg: "#fee2e2", text: "#991b1b", label: "Cancelada",  dot: "#dc2626" },
  finalizada: { bg: "#f1f5f9", text: "#475569", label: "Finalizada", dot: "#94a3b8" },
  rechazada:  { bg: "#fef3c7", text: "#92400e", label: "Rechazada",  dot: "#f59e0b" },
};

const FILTROS = ["todas", "aceptada", "cancelada", "finalizada"];

export default function ReservasPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [reservas,      setReservas]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [filtro,        setFiltro]        = useState("todas");
  const [cancelando,    setCancelando]    = useState(null);
  const [expandido,     setExpandido]     = useState(null);
  const [confirmar,     setConfirmar]     = useState(null);
  const [errorCancelar, setErrorCancelar] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const [data, metadatos] = await Promise.all([
          getMisReservas(),
          obtenerMetadatosEspacios(),
        ]);

        const metadatosPorGid = {};
        for (const m of metadatos) metadatosPorGid[Number(m.gid)] = m;

        const reservasEnriquecidas = data.map((r) => {
          const espaciosEnriquecidos = (r.espacios || []).map((e) => {
            const meta = metadatosPorGid[Number(e.espacioId)];
            return { ...e, nombre: meta?.nombre ?? `Espacio #${e.espacioId}`, categoria: meta?.categoria ?? null, planta: meta?.planta ?? null };
          });
          return { ...r, espaciosEnriquecidos, categoriaIcono: espaciosEnriquecidos[0]?.categoria ?? null };
        });

        setReservas(reservasEnriquecidas);
      } catch (err) {
        setError(err.message || "Error cargando reservas");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const handleCancelar = async () => {
    if (!confirmar) return;
    const reservaId = confirmar;
    setConfirmar(null);
    setCancelando(reservaId);
    try {
      await cancelarReserva(reservaId);
      setReservas((prev) => prev.map((r) => r.id === reservaId ? { ...r, estado: "cancelada" } : r));
    } catch (err) {
      setErrorCancelar(err.message || "Error cancelando la reserva");
    } finally {
      setCancelando(null);
    }
  };

  const reservasFiltradas = filtro === "todas" ? reservas : reservas.filter((r) => r.estado === filtro);

  const contadores = {
    aceptada:   reservas.filter((r) => r.estado === "aceptada").length,
    cancelada:  reservas.filter((r) => r.estado === "cancelada").length,
    finalizada: reservas.filter((r) => r.estado === "finalizada").length,
  };

  return (
    <div className="reservas-root">
      <Header backLink={{ label: "← Volver al mapa", to: "/" }} />

      <main className="reservas-main">
        <div className="reservas-header">
          <h2 className="reservas-title">Mis Reservas</h2>
          <p className="reservas-subtitle">Gestiona y consulta todas tus reservas de espacios</p>
        </div>

        <div className="reservas-contadores">
          {[
            { label: "Activas",     count: contadores.aceptada,  color: "#16a34a", bg: "#dcfce7" },
            { label: "Finalizadas", count: contadores.finalizada, color: "#475569", bg: "#f1f5f9" },
            { label: "Canceladas",  count: contadores.cancelada,  color: "#dc2626", bg: "#fee2e2" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className="reservas-contador-card" style={{ borderTop: `3px solid ${color}` }}>
              <p className="reservas-contador-num" style={{ color }}>{count}</p>
              <p className="reservas-contador-label">{label}</p>
            </div>
          ))}
        </div>

        <div className="reservas-filtros">
          {FILTROS.map((f) => {
            const estado = ESTADO_COLORES[f];
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`reservas-filtro-btn${filtro === f ? " reservas-filtro-btn--active" : ""}`}
              >
                {f !== "todas" && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: filtro === f ? "#fff" : estado?.dot, display: "inline-block", marginRight: 6 }} />
                )}
                {f === "todas" ? "Todas" : estado?.label}
              </button>
            );
          })}
          <span className="reservas-filtro-count">{reservasFiltradas.length} reservas</span>
        </div>

        {loading && (
          <div className="reservas-loading">
            <div className="reservas-spinner" />
            Cargando reservas...
          </div>
        )}
        {error && <div className="reservas-error">{error}</div>}

        {!loading && !error && reservasFiltradas.length === 0 && (
          <div className="reservas-empty">
            <svg className="reservas-empty-icon" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="12" y2="16"/>
            </svg>
            <p>No tienes reservas{filtro !== "todas" ? ` con estado "${ESTADO_COLORES[filtro]?.label?.toLowerCase() || filtro}"` : ""}.</p>
          </div>
        )}

        <div className="reservas-list">
          {reservasFiltradas.map((reserva) => {
            const estadoInfo    = ESTADO_COLORES[reserva.estado] || { bg: "#f1f5f9", text: "#475569", label: reserva.estado, dot: "#94a3b8" };
            const colorIcon     = colorIconPorCategoria(reserva.categoriaIcono);
            const espacios      = reserva.espaciosEnriquecidos || [];
            const nombreLabel   = espacios.length === 1 ? espacios[0].nombre : `${espacios[0]?.nombre || "Espacio"} +${espacios.length - 1} más`;
            const totalPersonas = espacios.reduce((acc, e) => acc + (e.numPersonas || 0), 0);
            const isExpanded    = expandido === reserva.id;

            return (
              <div key={reserva.id} className={`reservas-item-card ${reserva.estado === "cancelada" ? "reservas-item-card--cancelada" : ""}`}>
                <div className="reservas-item-estado-bar" style={{ background: estadoInfo.dot }} />
                <div className="reservas-item-body">
                  <div className="reservas-item-main">
                    <div className="reservas-item-left">
                      <div className="reservas-item-icon" style={{ background: colorIcon.bg, color: colorIcon.text }}>
                        <FiMapPin size={18} />
                      </div>
                      <div className="reservas-item-info">
                        <p className="reservas-item-nombre">{nombreLabel}</p>
                        <div className="reservas-item-meta">
                          <span className="reservas-item-meta-item">
                            <FiCalendar size={11} />
                            {new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="reservas-item-meta-sep">·</span>
                          <span className="reservas-item-meta-item">
                            <FiClock size={11} />
                            {reserva.horaInicio} — {reserva.horaFin}
                          </span>
                          {totalPersonas > 0 && (
                            <>
                              <span className="reservas-item-meta-sep">·</span>
                              <span className="reservas-item-meta-item"><FiUsers size={11} /> {totalPersonas} personas</span>
                            </>
                          )}
                          {reserva.tipoUso && (
                            <>
                              <span className="reservas-item-meta-sep">·</span>
                              <span className="reservas-item-meta-item" style={{ textTransform: "capitalize" }}>{reserva.tipoUso}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="reservas-item-right">
                      <span className="reservas-item-badge" style={{ background: estadoInfo.bg, color: estadoInfo.text }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: estadoInfo.dot, display: "inline-block", marginRight: 5 }} />
                        {estadoInfo.label}
                      </span>

                      {espacios.length > 1 && (
                        <button className="reservas-item-expand" onClick={() => setExpandido(isExpanded ? null : reserva.id)}>
                          {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                        </button>
                      )}

                      {reserva.estado === "aceptada" && (
                        <button
                          className="reservas-item-cancelar"
                          onClick={() => { setConfirmar(reserva.id); setErrorCancelar(""); }}
                          disabled={cancelando === reserva.id}
                        >
                          {cancelando === reserva.id ? <span className="reservas-spinner-sm" /> : <><FiX size={12} /> Cancelar</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && espacios.length > 1 && (
                    <div className="reservas-item-espacios">
                      {espacios.map((e, idx) => {
                        const ci = colorIconPorCategoria(e.categoria);
                        return (
                          <div key={idx} className="reservas-espacio-pill">
                            <span className="reservas-espacio-dot" style={{ background: ci.text }} />
                            <span>{e.nombre}</span>
                            {e.numPersonas && <span className="reservas-espacio-num">{e.numPersonas}p</span>}
                            {e.planta && <span className="reservas-espacio-planta">P{e.planta}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal de confirmación */}
      {confirmar && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-icon">
                <FiX size={20} color="#dc2626" />
              </div>
              <div>
                <p className="modal-title">Cancelar reserva</p>
                <p className="modal-subtitle">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="modal-body">¿Estás seguro de que quieres cancelar esta reserva?</p>
            {errorCancelar && <p className="modal-error">{errorCancelar}</p>}
            <div className="modal-actions">
              <button className="modal-btn modal-btn--secondary" onClick={() => setConfirmar(null)}>
                Mantener reserva
              </button>
              <button className="modal-btn modal-btn--danger" onClick={handleCancelar}>
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}