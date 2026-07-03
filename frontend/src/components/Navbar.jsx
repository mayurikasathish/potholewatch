import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/report", label: "Report" },
    { to: "/map", label: "Map" },
    { to: "/route", label: "Route Checker" },
    { to: "/authority", label: "Authority" }
  ];

  return (
    <nav style={{
      background: "var(--navy)",
      padding: "0 48px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 64,
      position: "sticky",
      top: 0,
      zIndex: 1000,
    }}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <span style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: "var(--white)",
          letterSpacing: "-0.3px",
        }}>
          Pothole<span style={{ color: "var(--amber)" }}>Watch</span>
        </span>
      </Link>

      <div style={{ display: "flex", gap: 32 }}>
        {links.map(({ to, label }) => (
          <Link key={to} to={to} style={{
            textDecoration: "none",
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 500,
            fontSize: 15,
            color: location.pathname === to ? "var(--amber)" : "rgba(255,255,255,0.75)",
            borderBottom: location.pathname === to ? "2px solid var(--amber)" : "2px solid transparent",
            paddingBottom: 4,
            transition: "color 0.2s",
          }}>
            {label}
          </Link>
        ))}
      </div>

      <Link to="/report" style={{
        background: "var(--amber)",
        color: "var(--navy)",
        fontFamily: "Space Grotesk, sans-serif",
        fontWeight: 600,
        fontSize: 14,
        padding: "8px 20px",
        borderRadius: 6,
        textDecoration: "none",
      }}>
        + Report Pothole
      </Link>
    </nav>
  );
}