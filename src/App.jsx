import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage    from "./pages/LoginPage/LoginPage";
import HomePage     from "./pages/HomePage/HomePage";
import ReservaPage  from "./pages/ReservaPage/ReservaPage";
import ReservasPage from "./pages/ReservasPage/ReservasPage";
import ProtectedRoute from "./router/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/reserva" element={<ProtectedRoute><ReservaPage /></ProtectedRoute>} />
        <Route path="/mis-reservas" element={<ProtectedRoute><ReservasPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;