import { useState, useEffect } from "react";

export function useRestriccionesReserva(rol) {
  const [restricciones, setRestricciones] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rol) {
      setLoading(false);
      return;
    }

    const obtenerRestricciones = async () => {
      try {
        const resp = await fetch(`http://localhost:3000/api/auth/restricciones/${rol}`);
        
        if (!resp.ok) {
          throw new Error("Error obteniendo restricciones");
        }

        const data = await resp.json();
        setRestricciones(data);
      } catch (err) {
        console.error("Error obteniendo restricciones:", err);
        setRestricciones(null);
      } finally {
        setLoading(false);
      }
    };

    obtenerRestricciones();
  }, [rol]);

  return { restricciones, loading };
}
