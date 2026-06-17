import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/login";
import Home from "./pages/home";
import ProtectedRoute from "./utils/protect";
import Discovery from "./pages/disc";
import Admin from "./pages/admin";
import LandingPage from "./pages/landing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>} />
        <Route path="/discovery" element={
          <ProtectedRoute>
            <Discovery />
          </ProtectedRoute>} />
        <Route path="/admin" element={
          <ProtectedRoute>
            {<Admin />}
          </ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;