import { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiUsers, FiMapPin, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { getReservasVivas, eliminarReservaAdmin } from "../../services/reservasService";
import { obtenerMetadatosEspacios } from "../../services/espaciosBackendService";
import { colorIconPorCategoria } from "../../utils/coloresEspacio";
import Header from "../../components/Header";
import "./GerenciaReservasPage.css";

const TIPO_COLORES = {
  en_curso: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", label: "En curso" },
  proxima:  { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6", label: "Próxima"  },
};

export default function GerenciaReservasPage() {
  const [reservas,    setReservas]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [eliminando,  setEliminando]  = useState(null);
  const [expandido,   setExpandido]   = useState(null);
  const [filtro,      setFiltro]      = useState("todas");
  const [confirmar,   setConfirmar]   = useState(null);
  const [errorEliminar, setErrorEliminar] = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setLoading(true);
      const [data, metadatos] = await Promise.all([
        getReservasVivas(),
        obtenerMetadatosEspacios(),
      ]);

      const metadatosPorGid = {};
      for (const m of metadatos) metadatosPorGid[Number(m.gid)] = m;

      const enriquecidas = data.map((r) => {
        const espaciosEnriquecidos = (r.espacios || []).map((e) => {
          const meta = metadatosPorGid[Number(e.espacioId)];
          return { ...e, nombre: meta?.nombre ?? `Espacio #${e.espacioId}`, categoria: meta?.categoria ?? null, planta: meta?.planta ?? null };
        });
        return { ...r, espaciosEnriquecidos, categoriaIcono: espaciosEnriquecidos[0]?.categoria ?? null };
      });

      setReservas(enriquecidas);
    } catch (err) {
      setError(err.message || "Error cargando reservas");
    } finally {
      setLoading(false);
    }
  }

  const handleEliminar = async () => {
    if (!confirmar) return;
    const reserva = confirmar;
    setConfirmar(null);
    setEliminando(reserva.id);
    try {
      await eliminarReservaAdmin(reserva.id);
      setReservas((prev) => prev.filter((r) => r.id !== reserva.id));
    } catch (err) {
      setErrorEliminar(err.message || "Error eliminando la reserva");
    } finally {
      setEliminando(null);
    }
  };

  const reservasFiltradas = filtro === "todas" ? reservas : reservas.filter((r) => r.tipo === filtro);

  const contadores = {
    en_curso: reservas.filter((r) => r.tipo === "en_curso").length,
    proxima:  reservas.filter((r) => r.tipo === "proxima").length,
  };

  return (
    <div className="gerencia-root">
      <Header backLink={{ label: "← Volver al mapa", to: "/" }} />

      <main className="gerencia-main">
        <div className="gerencia-header">
          <h2 className="gerencia-title">Reservas Vivas</h2>
          <p className="gerencia-subtitle">Gestiona todas las reservas activas del sistema</p>
        </div>

        <div className="gerencia-contadores">
          {[
            { label: "En curso",  count: contadores.en_curso, color: "#f59e0b", bg: "#fef3c7" },
            { label: "Próximas",  count: contadores.proxima,  color: "#3b82f6", bg: "#dbeafe" },
            { label: "Total",     count: reservas.length,     color: "#111827", bg: "#f3f4f6" },
          ].map(({ label, count, color }) => (
            <div key={label} className="gerencia-contador-card" style={{ borderTop: `3px solid ${color}` }}>
              <p className="gerencia-contador-num" style={{ color }}>{count}</p>
              <p className="gerencia-contador-label">{label}</p>
            </div>
          ))}
        </div>

        <div className="gerencia-filtros">
          {[
            { key: "todas",    label: "Todas" },
            { key: "en_curso", label: "En curso" },
            { key: "proxima",  label: "Próximas" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`gerencia-filtro-btn${filtro === key ? " gerencia-filtro-btn--active" : ""}`}
            >
              {key !== "todas" && (
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: filtro === key ? "#fff" : TIPO_COLORES[key]?.dot, display: "inline-block", marginRight: 6 }} />
              )}
              {label}
            </button>
          ))}
          <span className="gerencia-filtro-count">{reservasFiltradas.length} reservas</span>
          <button className="gerencia-refresh-btn" onClick={cargar} disabled={loading}>
            {loading ? "Cargando..." : "↻ Actualizar"}
          </button>
        </div>

        {loading && <div className="gerencia-loading"><div className="gerencia-spinner" /> Cargando reservas...</div>}
        {error && <div className="gerencia-error">{error}</div>}

        {!loading && !error && reservasFiltradas.length === 0 && (
          <div className="gerencia-empty">
            <svg className="gerencia-empty-icon" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="12" y2="16"/>
            </svg>
            <p>No hay reservas{filtro !== "todas" ? ` ${filtro === "en_curso" ? "en curso" : "próximas"}` : ""} en este momento.</p>
          </div>
        )}

        <div className="gerencia-list">
          {reservasFiltradas.map((reserva) => {
            const tipoInfo      = TIPO_COLORES[reserva.tipo] || TIPO_COLORES.proxima;
            const colorIcon     = colorIconPorCategoria(reserva.categoriaIcono);
            const espacios      = reserva.espaciosEnriquecidos || [];
            const nombreLabel   = espacios.length === 1 ? espacios[0].nombre : `${espacios[0]?.nombre || "Espacio"} +${espacios.length - 1} más`;
            const totalPersonas = espacios.reduce((acc, e) => acc + (e.numPersonas || 0), 0);
            const isExpanded    = expandido === reserva.id;

            return (
              <div key={reserva.id} className="gerencia-item-card">
                <div className="gerencia-item-bar" style={{ background: tipoInfo.dot }} />
                <div className="gerencia-item-body">
                  <div className="gerencia-item-main">
                    <div className="gerencia-item-left">
                      <div className="gerencia-item-icon" style={{ background: colorIcon.bg, color: colorIcon.text }}>
                        <FiMapPin size={18} />
                      </div>
                      <div className="gerencia-item-info">
                        <p className="gerencia-item-nombre">{nombreLabel}</p>
                        <p className="gerencia-item-usuario">
                          {reserva.usuarioNombre || `Usuario #${reserva.usuarioId}`}
                          {reserva.usuarioRol && <span style={{ color: "#9ca3af" }}> · {reserva.usuarioRol}</span>}
                          {reserva.usuarioEmail && <span style={{ color: "#9ca3af" }}> · {reserva.usuarioEmail}</span>}
                        </p>
                        <div className="gerencia-item-meta">
                          <span className="gerencia-item-meta-item"><FiCalendar size={11} />
                            {new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="gerencia-item-meta-sep">·</span>
                          <span className="gerencia-item-meta-item"><FiClock size={11} /> {reserva.horaInicio} — {reserva.horaFin}</span>
                          {totalPersonas > 0 && (<><span className="gerencia-item-meta-sep">·</span><span className="gerencia-item-meta-item"><FiUsers size={11} /> {totalPersonas} personas</span></>)}
                          {reserva.tipoUso && (<><span className="gerencia-item-meta-sep">·</span><span className="gerencia-item-meta-item" style={{ textTransform: "capitalize" }}>{reserva.tipoUso}</span></>)}
                        </div>
                      </div>
                    </div>

                    <div className="gerencia-item-right">
                      <span className="gerencia-item-badge" style={{ background: tipoInfo.bg, color: tipoInfo.text }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: tipoInfo.dot, display: "inline-block", marginRight: 5 }} />
                        {tipoInfo.label}
                      </span>

                      {espacios.length > 1 && (
                        <button className="gerencia-item-expand" onClick={() => setExpandido(isExpanded ? null : reserva.id)}>
                          {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                        </button>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <button
                          className={`gerencia-item-eliminar${!reserva.puedeEliminar ? " gerencia-item-eliminar--disabled" : ""}`}
                          onClick={() => { if (reserva.puedeEliminar) { setConfirmar(reserva); setErrorEliminar(""); } }}
                          disabled={!reserva.puedeEliminar || eliminando === reserva.id}
                          title={reserva.motivoBloqueo || "Eliminar reserva"}
                        >
                          {eliminando === reserva.id ? <span className="gerencia-spinner-sm" /> : <><FiTrash2 size={12} /> Eliminar</>}
                        </button>
                        {!reserva.puedeEliminar && reserva.motivoBloqueo && (
                          <span style={{ fontSize: 10, color: "#9ca3af", maxWidth: 160, textAlign: "right", lineHeight: 1.3 }}>
                            {reserva.motivoBloqueo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && espacios.length > 1 && (
                    <div className="gerencia-item-espacios">
                      {espacios.map((e, idx) => {
                        const ci = colorIconPorCategoria(e.categoria);
                        return (
                          <div key={idx} className="gerencia-espacio-pill">
                            <span className="gerencia-espacio-dot" style={{ background: ci.text }} />
                            <span>{e.nombre}</span>
                            {e.numPersonas && <span className="gerencia-espacio-num">{e.numPersonas}p</span>}
                            {e.planta && <span className="gerencia-espacio-planta">P{e.planta}</span>}
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

      {/* Modal de confirmación de eliminación */}
      {confirmar && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-icon">
                <FiTrash2 size={20} color="#dc2626" />
              </div>
              <div>
                <p className="modal-title">Eliminar reserva</p>
                <p className="modal-subtitle">El usuario será notificado automáticamente</p>
              </div>
            </div>
            <p className="modal-body">¿Seguro que quieres eliminar esta reserva?</p>
            {errorEliminar && <p className="modal-error">{errorEliminar}</p>}
            <div className="modal-actions">
              <button className="modal-btn modal-btn--secondary" onClick={() => setConfirmar(null)}>
                Cancelar
              </button>
              <button className="modal-btn modal-btn--danger" onClick={handleEliminar}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}