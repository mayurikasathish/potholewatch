import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ReportPage from "./pages/ReportPage";
import MapDashboard from "./pages/MapDashboard";
import RouteChecker from "./pages/RouteChecker";
import Navbar from "./components/Navbar";
import AuthorityDashboard from "./pages/AuthorityDashboard";


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/map" element={<MapDashboard />} />
        <Route path="/route" element={<RouteChecker />} />
        <Route path="/authority" element={<AuthorityDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}