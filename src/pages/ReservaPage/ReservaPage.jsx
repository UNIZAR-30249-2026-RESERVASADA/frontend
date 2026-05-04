import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiUsers, FiFileText, FiMessageSquare, FiMapPin, FiAlertCircle, FiInfo } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { colorIconPorCategoria } from "../../utils/coloresEspacio";
import { crearReserva } from "../../services/reservasService";
import Header from "../../components/Header";
import "./ReservaPage.css";

export default function ReservaPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { usuario } = useAuth();

  // Recibe array de espacios desde HomePage
  const espacios = location.state?.espacios || [];

  // Calcular aforo permitido por espacio según porcentaje efectivo
  const aforoPermitidoPorEspacio = React.useMemo(() => {
    const resultado = {};
    for (const esp of espacios) {
      const aforo = esp.aforo ?? null;
      const pct   = esp.porcentajeOcupacion ?? esp.edificioPorcentaje ?? 100;
      const id    = esp.gid || esp.id_espacio;
      resultado[id] = aforo !== null ? Math.floor(aforo * pct / 100) : null;
    }
    return resultado;
  }, [espacios]);

  // Calcular intersección de horarios de todos los espacios seleccionados
  const horarioInterseccion = React.useMemo(() => {
    if (!espacios.length) return null;
    let apertura = null;
    let cierre   = null;
    for (const esp of espacios) {
      const ap = esp.horarioApertura || esp.edificioHorarioApertura || null;
      const ci = esp.horarioCierre   || esp.edificioHorarioCierre   || null;
      if (ap) apertura = apertura ? (ap > apertura ? ap : apertura) : ap;
      if (ci) cierre   = cierre   ? (ci < cierre   ? ci : cierre)   : ci;
    }
    return { apertura, cierre };
  }, [espacios]);

  const [fecha,         setFecha]         = useState("");
  const [horaInicio,    setHoraInicio]    = useState("");
  const [duracion,      setDuracion]      = useState("");
  const [tipoUso,       setTipoUso]       = useState("docencia");
  const [infoAdicional, setInfoAdicional] = useState("");
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);

  const advertenciaHorario = React.useMemo(() => {
    if (!horaInicio || !duracion || !horarioInterseccion?.cierre) return null;
    const [hI, mI] = horaInicio.split(":").map(Number);
    const minInicio = hI * 60 + mI;
    const minFin    = minInicio + Number(duracion) * 60;
    const [hC, mC] = horarioInterseccion.cierre.split(":").map(Number);
    const minCierre = hC * 60 + mC;
    if (minFin > minCierre) {
      const horaFinCalc = `${String(Math.floor(minFin / 60)).padStart(2, "0")}:${String(minFin % 60).padStart(2, "0")}`;
      return `La reserva terminaría a las ${horaFinCalc}, fuera del horario de cierre (${horarioInterseccion.cierre}).`;
    }
    if (horarioInterseccion?.apertura && horaInicio < horarioInterseccion.apertura) {
      return `La hora de inicio es anterior al horario de apertura (${horarioInterseccion.apertura}).`;
    }
    return null;
  }, [horaInicio, duracion, horarioInterseccion]);

  // numPersonas por espacio: { [gid]: number }
  const [numPersonasPorEspacio, setNumPersonasPorEspacio] = useState({});
  // Espacio actualmente seleccionado en el desplegable de asistentes
  const [espacioActivoIdx, setEspacioActivoIdx] = useState(0);

  const espacioActivo = espacios[espacioActivoIdx] || null;
  const gidActivo     = espacioActivo?.gid || espacioActivo?.id_espacio;

  const handleNumPersonasChange = (valor) => {
    if (!gidActivo) return;
    setNumPersonasPorEspacio((prev) => ({ ...prev, [gidActivo]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (espacios.length === 0) {
      setError("No se ha seleccionado ningún espacio");
      return;
    }

    // Validar que todos los espacios tienen numPersonas
    for (const esp of espacios) {
      const id = esp.gid || esp.id_espacio;
      if (!numPersonasPorEspacio[id]) {
        setError(`Indica el número de asistentes para "${esp.nombre || esp.id_espacio}"`);
        return;
      }
    }

    setLoading(true);
    try {
      await crearReserva({
        espacios: espacios.map((esp) => ({
          espacioId:   esp.gid || esp.id_espacio,
          numPersonas: numPersonasPorEspacio[esp.gid || esp.id_espacio]
            ? Number(numPersonasPorEspacio[esp.gid || esp.id_espacio])
            : null,
        })),
        fecha,
        horaInicio:  horaInicio.slice(0, 5),
        duracion:    Number(duracion) * 60, // convertir horas a minutos para el backend
        tipoUso,
        descripcion: infoAdicional,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "No se pudo crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reserva-root">
      <Header />

      <main className="reserva-main">
        {/* Cabecera */}
        <section className="reserva-card">
          <button
            type="button" onClick={() => navigate("/")}
            style={{ border: "none", background: "none", color: "#6b7280", fontSize: 13, marginBottom: 16, cursor: "pointer", fontWeight: 500 }}
          >
            ← Volver al mapa
          </button>
          <h1 className="reserva-title">Nueva Reserva</h1>
          <p className="reserva-subtitle">Completa los detalles para confirmar tu reserva</p>
        </section>

        {/* Lista de espacios seleccionados */}
        <section className="reserva-card">
          <h2 className="reserva-card-title">
            {espacios.length === 1 ? "Espacio seleccionado" : `Espacios seleccionados (${espacios.length})`}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {espacios.map((esp, idx) => {
              const colorIcon = colorIconPorCategoria(esp.categoria || "N/D");
              const nombre    = esp.nombre || esp.id_espacio || "Espacio";
              const planta    = esp.planta ?? "N/D";
              const aforo     = esp.aforo  ?? "N/D";
              return (
                <div key={esp.gid || esp.id_espacio || idx} className="reserva-space-card">
                  <div className="reserva-space-icon" style={{ backgroundColor: colorIcon.bg, color: colorIcon.text }}>
                    <FiMapPin size={22} />
                  </div>
                  <div className="reserva-space-info">
                    <h3>{nombre}</h3>
                    <p>{esp.uso || "N/D"} · Planta {planta}</p>
                  </div>
                  <div className="reserva-space-capacity">
                    <div className="reserva-space-capacity-icon" style={{ color: colorIcon.text }}>
                      <FiUsers size={18} />
                    </div>
                    <div className="reserva-space-capacity-text">
                      {(() => {
                        const id = esp.gid || esp.id_espacio;
                        const pct = esp.porcentajeOcupacion ?? esp.edificioPorcentaje ?? 100;
                        const aforoPermitido = aforoPermitidoPorEspacio[id];
                        if (pct < 100 && aforoPermitido !== null) {
                          return (
                            <>
                              <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: 11 }}>{aforo} personas</span>
                              <span style={{ color: colorIcon.text, fontWeight: 600 }}>{aforoPermitido} máx. ({pct}%)</span>
                            </>
                          );
                        }
                        return <span>{aforo} personas</span>;
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Formulario */}
        <section className="reserva-card">
          <h2 className="reserva-card-title">Detalles de la Reserva</h2>

          {/* Aviso de horario disponible */}
          {horarioInterseccion?.apertura && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 10, padding: "12px 14px", marginBottom: 16,
              fontSize: 13, color: "#1e40af",
            }}>
              <FiInfo size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Horario disponible para esta reserva:</strong>
                <span style={{ marginLeft: 6 }}>
                  {horarioInterseccion.apertura} – {horarioInterseccion.cierre}
                </span>
                {espacios.length > 1 && (
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>
                    Intersección de los horarios de todos los espacios seleccionados
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Fecha y hora */}
            <div className="reserva-form-grid">
              <div className="reserva-form-group">
                <label className="reserva-form-label">
                  <FiCalendar style={{ display: "inline", marginRight: 6 }} />Fecha
                </label>
                <input
                  type="date" className="reserva-form-input"
                  value={fecha} onChange={(e) => setFecha(e.target.value)} required
                />
              </div>
              <div className="reserva-form-group">
                <label className="reserva-form-label">
                  <FiClock style={{ display: "inline", marginRight: 6 }} />Hora de inicio
                </label>
                <input
                  type="time" className="reserva-form-input"
                  value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required
                  min={horarioInterseccion?.apertura || undefined}
                  max={horarioInterseccion?.cierre   || undefined}
                />
              </div>
            </div>

            {/* Duración */}
            <div style={{ marginBottom: 16 }}>
              <label className="reserva-form-label">
                <FiClock style={{ display: "inline", marginRight: 6 }} />Duración
              </label>
              <input
                type="number"
                className="reserva-form-input"
                min="1"
                max="12"
                step="1"
                placeholder="Ej: 2"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
              />
              {advertenciaHorario && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6,
                  background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6,
                  padding: "6px 10px", fontSize: 12, color: "#92400e" }}>
                  <FiAlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{advertenciaHorario}</span>
                </div>
              )}
            </div>

            {/* Asistentes por espacio */}
            <div style={{ marginBottom: 16 }}>
              <label className="reserva-form-label">
                <FiUsers style={{ display: "inline", marginRight: 6 }} />Número de asistentes por espacio
              </label>
              <div className="reserva-asistentes-grid">
                {/* Selector de espacio */}
                <div className="reserva-field-select">
                  <select
                    className="reserva-form-select"
                    value={espacioActivoIdx}
                    onChange={(e) => setEspacioActivoIdx(Number(e.target.value))}
                  >
                    {espacios.map((esp, idx) => (
                      <option key={esp.gid || esp.id_espacio || idx} value={idx}>
                        {esp.nombre || esp.id_espacio || `Espacio ${idx + 1}`}
                        {numPersonasPorEspacio[esp.gid || esp.id_espacio]
                          ? ` — ${numPersonasPorEspacio[esp.gid || esp.id_espacio]} pers.`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input num personas del espacio seleccionado */}
                <input
                  type="number"
                  min={1}
                  required
                  max={aforoPermitidoPorEspacio[gidActivo] ?? espacioActivo?.aforo ?? undefined}
                  className="reserva-form-input"
                  value={numPersonasPorEspacio[gidActivo] || ""}
                  onChange={(e) => handleNumPersonasChange(e.target.value)}
                  placeholder={
                    aforoPermitidoPorEspacio[gidActivo] !== null && aforoPermitidoPorEspacio[gidActivo] !== undefined
                      ? `Máx. ${aforoPermitidoPorEspacio[gidActivo]} (${espacioActivo?.porcentajeOcupacion ?? espacioActivo?.edificioPorcentaje ?? 100}%)`
                      : espacioActivo?.aforo ? `Máx. ${espacioActivo.aforo}` : "Nº personas"
                  }
                />
              </div>
              {/* Resumen por espacio */}
              {espacios.length > 1 && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {espacios.map((esp, idx) => {
                    const id  = esp.gid || esp.id_espacio;
                    const num = numPersonasPorEspacio[id];
                    return (
                      <span
                        key={id || idx}
                        style={{
                          fontSize: 11, padding: "3px 10px", borderRadius: 999,
                          background: num ? "#dbeafe" : "#f3f4f6",
                          color:      num ? "#1d4ed8" : "#9ca3af",
                          fontWeight: 500,
                        }}
                      >
                        {esp.nombre || `Espacio ${idx + 1}`}: {num ? `${num} pers.` : "—"}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tipo de uso */}
            <div style={{ marginBottom: 16 }}>
              <label className="reserva-form-label">
                <FiFileText style={{ display: "inline", marginRight: 6 }} />Tipo de uso
              </label>
              <div className="reserva-field-select">
                <select className="reserva-form-select" value={tipoUso} onChange={(e) => setTipoUso(e.target.value)}>
                  <option value="docencia">Docencia</option>
                  <option value="reunion">Reunión</option>
                  <option value="examen">Examen</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>

            {/* Información adicional */}
            <div style={{ marginBottom: 16 }}>
              <label className="reserva-form-label">
                <FiMessageSquare style={{ display: "inline", marginRight: 6 }} />Información adicional
              </label>
              <textarea
                className="reserva-form-input reserva-textarea" rows={4}
                value={infoAdicional}
                onChange={(e) => setInfoAdicional(e.target.value.slice(0, 500))}
                placeholder="Añade cualquier información relevante..."
              />
              <div className="reserva-char-count">{infoAdicional.length}/500 caracteres</div>
            </div>

            {error && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className="reserva-btn-group">
              <button type="button" className="reserva-btn-secondary" onClick={() => navigate("/")}>
                Cancelar
              </button>
              <button type="submit" className="reserva-btn-primary" disabled={loading}>
                {loading ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}