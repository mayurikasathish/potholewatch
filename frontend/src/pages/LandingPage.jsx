import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function AnimatedCounter({ target, duration = 1500 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps = 40;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count}</span>;
}

export default function LandingPage() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, high_severity: 0 });

  useEffect(() => {
    axios.get(`${API}/detections`).then((res) => {
      const data = res.data;
      const resolved = data.filter((d) => d.status === "resolved").length;
      const high = data.filter((d) => d.confidence_avg > 0.6).length;
      setStats({ total: data.length, resolved, high_severity: high });
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: "var(--navy)",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        padding: "80px 48px",
        gap: 64,
      }}>
        <div style={{ flex: 1, maxWidth: 560 }}>
          <div style={{
            display: "inline-block",
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 20,
            padding: "6px 16px",
            marginBottom: 24,
          }}>
            <span style={{ color: "var(--amber)", fontSize: 13, fontWeight: 600, fontFamily: "Space Grotesk, sans-serif" }}>
              AI-Powered Road Safety
            </span>
          </div>

          <h1 style={{
            fontSize: 56,
            fontWeight: 700,
            color: "var(--white)",
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: "-1px",
          }}>
            Every pothole.<br />
            <span style={{ color: "var(--amber)" }}>Detected.</span><br />
            Reported. Fixed.
          </h1>

          <p style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.7,
            marginBottom: 40,
            fontFamily: "Inter, sans-serif",
          }}>
            Upload a road photo and our YOLOv8 model instantly detects potholes,
            geo-tags them, and adds them to a live city-wide map for authorities to act on.
          </p>

          <div style={{ display: "flex", gap: 16 }}>
            <Link to="/report" style={{
              background: "var(--amber)",
              color: "var(--navy)",
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              padding: "14px 32px",
              borderRadius: 8,
              textDecoration: "none",
            }}>
              Report a Pothole
            </Link>
            <Link to="/map" style={{
              background: "transparent",
              color: "var(--white)",
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 600,
              fontSize: 16,
              padding: "14px 32px",
              borderRadius: 8,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
              View Live Map
            </Link>
          </div>
        </div>

        {/* Stats Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { label: "Potholes Reported", value: stats.total, unit: "total", color: "var(--amber)" },
            { label: "High Severity", value: stats.high_severity, unit: "critical", color: "#EF4444" },
            { label: "Resolved", value: stats.resolved, unit: "fixed", color: "#10B981" },
          ].map(({ label, value, unit, color }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderLeft: `4px solid ${color}`,
              borderRadius: 12,
              padding: "28px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 16,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 500,
              }}>
                {label}
              </span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 48, fontWeight: 700, color, fontFamily: "Space Grotesk, sans-serif" }}>
                  <AnimatedCounter target={value} />
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "96px 48px", background: "var(--gray-light)" }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>
          How PotholeWatch works
        </h2>
        <p style={{ textAlign: "center", color: "var(--gray)", marginBottom: 64, fontSize: 16 }}>
          From photo to city dashboard in seconds
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, maxWidth: 1000, margin: "0 auto" }}>
          {[
            { step: "01", icon: "📸", title: "Upload Photo", desc: "Take a photo of a pothole or upload one from your device" },
            { step: "02", icon: "🤖", title: "AI Detection", desc: "YOLOv8 model detects and classifies potholes with bounding boxes" },
            { step: "03", icon: "📍", title: "Auto Geo-tag", desc: "GPS extracted from image EXIF or pinned manually on map" },
            { step: "04", icon: "🗺️", title: "Live Dashboard", desc: "Added to city map instantly for authorities to act on" },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} style={{
              background: "var(--white)",
              borderRadius: 12,
              padding: 32,
              border: "1px solid var(--border)",
              position: "relative",
            }}>
              <span style={{
                position: "absolute", top: 20, right: 20,
                fontSize: 11, fontWeight: 700, color: "var(--amber)",
                fontFamily: "Space Grotesk, sans-serif", letterSpacing: 1,
              }}>{step}</span>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: "var(--gray)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: "var(--navy)",
        padding: "32px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          © 2026 PotholeWatch. Built with YOLOv8 + FastAPI + React.
        </span>
        <span style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontWeight: 700, fontSize: 16,
          color: "var(--white)",
        }}>
          Pothole<span style={{ color: "var(--amber)" }}>Watch</span>
        </span>
      </footer>
    </div>
  );
}