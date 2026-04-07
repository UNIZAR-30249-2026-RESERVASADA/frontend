import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiUsers, FiFileText, FiMessageSquare, FiMapPin, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { colorIconPorCategoria } from "../../utils/coloresEspacio";
import { crearReserva } from "../../services/reservasService";
import unizarLogo from "../../assets/images/unizar.png";
import "./ReservaPage.css";

export default function ReservaPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const espacio   = location.state?.espacio || null;
  const { usuario, logout } = useAuth();

  const [fecha,         setFecha]         = useState("");
  const [horaInicio,    setHoraInicio]    = useState("");
  const [duracion,      setDuracion]      = useState("60");
  const [asistentes,    setAsistentes]    = useState("");
  const [tipoUso,       setTipoUso]       = useState("docencia");
  const [infoAdicional, setInfoAdicional] = useState("");
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);

  const datosEspacio = espacio
    ? {
        nombre:    espacio.nombre || espacio.id_espacio || "Espacio",
        uso:       espacio.uso       || "N/D",
        categoria: espacio.categoria || "N/D",
        planta:    espacio.planta    ?? "N/D",
        capacidad: espacio.aforo     ?? "N/D",
      }
    : { nombre: "Aula 1.01", uso: "Aula", categoria: "Aula", planta: "P1", capacidad: 40 };

  const colorIcon = colorIconPorCategoria(datosEspacio.categoria);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!espacio) {
      setError("No se ha seleccionado un espacio");
      return;
    }

    setLoading(true);
    try {
      await crearReserva({
        espacioId:   espacio.gid,
        fecha,
        horaInicio:  horaInicio.slice(0, 5),
        duracion:    Number(duracion),
        numPersonas: asistentes ? Number(asistentes) : null,
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
      <header className="reserva-topbar">
        <div className="reserva-topbar-left">
          <img src={unizarLogo} alt="Universidad Zaragoza" className="reserva-logo-img" />
          <div>
            <h1 className="reserva-app-title">ByronSpace</h1>
            <p className="reserva-app-subtitle">Sistema de Reservas · Ada Byron</p>
          </div>
        </div>
        <div className="reserva-topbar-right">
          <button className="reserva-topbar-link" onClick={() => navigate("/mis-reservas")}>
            Mis reservas
          </button>
          <div className="reserva-user-info">
            <div className="reserva-user-details">
              <div className="reserva-user-name">{usuario?.nombre || "Usuario"}</div>
              <div className="reserva-user-role">{usuario?.rol || "Sin rol"}</div>
            </div>
            <div className="reserva-user-circle">
              {(usuario?.nombre || "U").charAt(0).toUpperCase()}
            </div>
          </div>
          <button
            className="reserva-topbar-logout"
            onClick={() => { logout(); navigate("/login"); }}
            title="Cerrar sesión"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      <main className="reserva-main">
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

        <section className="reserva-card">
          <div className="reserva-space-card">
            <div className="reserva-space-icon" style={{ backgroundColor: colorIcon.bg, color: colorIcon.text }}>
              <FiMapPin size={24} />
            </div>
            <div className="reserva-space-info">
              <h3>{datosEspacio.nombre}</h3>
              <p>{datosEspacio.uso} · Planta {datosEspacio.planta}</p>
            </div>
            <div className="reserva-space-capacity">
              <div className="reserva-space-capacity-icon" style={{ color: colorIcon.text }}>
                <FiUsers size={20} />
              </div>
              <div className="reserva-space-capacity-text">{datosEspacio.capacidad} personas</div>
            </div>
          </div>
        </section>

        <section className="reserva-card">
          <h2 className="reserva-card-title">Detalles de la Reserva</h2>

          <form onSubmit={handleSubmit}>
            <div className="reserva-form-grid">
              <div className="reserva-form-group">
                <label className="reserva-form-label">
                  <FiCalendar style={{ display: "inline", marginRight: 6 }} />Fecha
                </label>
                <input type="date" className="reserva-form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              </div>
              <div className="reserva-form-group">
                <label className="reserva-form-label">
                  <FiClock style={{ display: "inline", marginRight: 6 }} />Hora de inicio
                </label>
                <input type="time" className="reserva-form-input" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
              </div>
            </div>

            <div className="reserva-form-grid">
              <div className="reserva-form-group">
                <label className="reserva-form-label">
                  <FiClock style={{ display: "inline", marginRight: 6 }} />Duración
                </label>
                <div className="reserva-field-select">
                  <select className="reserva-form-select" value={duracion} onChange={(e) => setDuracion(e.target.value)}>
                    <option value="60">1 hora</option>
                    <option value="120">2 horas</option>
                    <option value="180">3 horas</option>
                    <option value="240">4 horas</option>
                  </select>
                </div>
              </div>
              <div className="reserva-form-group">
                <label className="reserva-form-label">
                  <FiUsers style={{ display: "inline", marginRight: 6 }} />Asistentes
                </label>
                <input
                  type="number" min={1} max={datosEspacio.capacidad}
                  className="reserva-form-input" value={asistentes}
                  onChange={(e) => setAsistentes(e.target.value)}
                  placeholder={`Máx. ${datosEspacio.capacidad}`}
                />
              </div>
            </div>

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