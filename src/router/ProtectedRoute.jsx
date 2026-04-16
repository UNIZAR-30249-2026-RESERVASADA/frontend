import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, soloGerente = false }) {
  const { usuario, loading } = useAuth();

  if (loading) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (soloGerente && !usuario.esGerente) return <Navigate to="/" replace />;

  return children;
}