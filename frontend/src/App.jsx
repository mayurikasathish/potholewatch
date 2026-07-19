import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
      <Toaster position="top-right" toastOptions={{
      duration: 4000,
      style: {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 14,
      },
    }} />
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