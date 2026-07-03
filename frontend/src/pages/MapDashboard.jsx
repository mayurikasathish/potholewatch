import { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API = "http://127.0.0.1:8000";

function severityColor(confidence_avg) {
  if (confidence_avg > 0.6) return "#EF4444";
  if (confidence_avg > 0.4) return "#F59E0B";
  return "#10B981";
}

function severityLabel(confidence_avg) {
  if (confidence_avg > 0.6) return "High";
  if (confidence_avg > 0.4) return "Medium";
  return "Low";
}

function createColoredIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 16px; height: 16px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapDashboard() {
  const [detections, setDetections] = useState([]);
  const [filter, setFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get(`${API}/detections`).then((res) => setDetections(res.data));
  }, []);

  const filtered = detections.filter((d) => {
    const statusMatch = filter === "all" || d.status === filter;
    const severity = severityLabel(d.confidence_avg).toLowerCase();
    const severityMatch = severityFilter === "all" || severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const stats = {
    total: detections.length,
    high: detections.filter((d) => d.confidence_avg > 0.6).length,
    medium: detections.filter((d) => d.confidence_avg > 0.4 && d.confidence_avg <= 0.6).length,
    low: detections.filter((d) => d.confidence_avg <= 0.4).length,
    resolved: detections.filter((d) => d.status === "resolved").length,
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>

      {/* Sidebar */}
      <div style={{
        width: 320,
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ color: "var(--white)", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            Live Map Dashboard
          </h2>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total", value: stats.total, color: "var(--white)" },
              { label: "Resolved", value: stats.resolved, color: "#10B981" },
              { label: "High", value: stats.high, color: "#EF4444" },
              { label: "Medium", value: stats.medium, color: "#F59E0B" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: "12px 14px",
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "Space Grotesk, sans-serif" }}>{value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>STATUS</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["all", "reported", "under_review", "resolved"].map((s) => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: filter === s ? "var(--amber)" : "rgba(255,255,255,0.1)",
                  color: filter === s ? "var(--navy)" : "rgba(255,255,255,0.7)",
                  fontFamily: "Space Grotesk, sans-serif",
                }}>
                  {s === "all" ? "All" : s === "under_review" ? "In Review" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>SEVERITY</p>
            <div style={{ display: "flex", gap: 8 }}>
              {["all", "high", "medium", "low"].map((s) => (
                <button key={s} onClick={() => setSeverityFilter(s)} style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: severityFilter === s ? "var(--amber)" : "rgba(255,255,255,0.1)",
                  color: severityFilter === s ? "var(--navy)" : "rgba(255,255,255,0.7)",
                  fontFamily: "Space Grotesk, sans-serif",
                }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Show density circles</span>
            <div
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: showHeatmap ? "var(--amber)" : "rgba(255,255,255,0.2)",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "white",
                position: "absolute", top: 3,
                left: showHeatmap ? 23 : 3,
                transition: "left 0.2s",
              }} />
            </div>
          </div>
        </div>

        {/* Detection list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>
            REPORTS ({filtered.length})
          </p>
          {filtered.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelected(d)}
              style={{
                background: selected?.id === d.id ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
                border: selected?.id === d.id ? "1px solid var(--amber)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "var(--white)", fontSize: 13, fontWeight: 600 }}>
                  {d.pothole_count} pothole{d.pothole_count !== 1 ? "s" : ""}
                </span>
                <span style={{
                  background: severityColor(d.confidence_avg),
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                }}>
                  {severityLabel(d.confidence_avg)}
                </span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "monospace" }}>
                {d.latitude?.toFixed(4)}, {d.longitude?.toFixed(4)}
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>
                {new Date(d.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", marginTop: 32 }}>
              No reports match the current filters
            </p>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[19.0760, 72.8777]} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filtered.map((d) => (
            <Marker
              key={d.id}
              position={[d.latitude, d.longitude]}
              icon={createColoredIcon(severityColor(d.confidence_avg))}
            >
              <Popup>
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: 160 }}>
                  <strong style={{ fontSize: 14 }}>{d.pothole_count} Pothole{d.pothole_count !== 1 ? "s" : ""} Detected</strong>
                  <br />
                  <span style={{ color: severityColor(d.confidence_avg), fontWeight: 600, fontSize: 12 }}>
                    {severityLabel(d.confidence_avg)} Severity
                  </span>
                  <br />
                  <span style={{ fontSize: 12, color: "#666" }}>Confidence: {Math.round(d.confidence_avg * 100)}%</span>
                  <br />
                  <span style={{ fontSize: 12, color: "#666" }}>Status: {d.status}</span>
                  <br />
                  <span style={{ fontSize: 11, color: "#999" }}>{new Date(d.created_at).toLocaleString()}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {showHeatmap && filtered.map((d) => (
            <Circle
              key={`circle-${d.id}`}
              center={[d.latitude, d.longitude]}
              radius={300}
              pathOptions={{
                color: severityColor(d.confidence_avg),
                fillColor: severityColor(d.confidence_avg),
                fillOpacity: 0.15,
                weight: 1,
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}