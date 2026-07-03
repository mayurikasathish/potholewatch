import { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API = "http://127.0.0.1:8000";

function severityColor(conf) {
  if (conf > 0.6) return "#EF4444";
  if (conf > 0.4) return "#F59E0B";
  return "#10B981";
}

function severityLabel(conf) {
  if (conf > 0.6) return "High";
  if (conf > 0.4) return "Medium";
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

// geocode a place name to lat/lng
async function geocode(placeName) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`
  );
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
}

function RiskBadge({ total, high }) {
  const level = high > 2 ? "HIGH RISK" : high > 0 ? "MODERATE" : total > 0 ? "LOW RISK" : "CLEAR";
  const color = high > 2 ? "#EF4444" : high > 0 ? "#F59E0B" : total > 0 ? "#10B981" : "#6B7280";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: `${color}20`, border: `1px solid ${color}`,
      borderRadius: 8, padding: "8px 16px",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ color, fontWeight: 700, fontSize: 14, fontFamily: "Space Grotesk, sans-serif" }}>
        {level}
      </span>
    </div>
  );
}

export default function RouteChecker() {
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [radius, setRadius] = useState(1.0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);

  const handleCheck = async () => {
    if (!fromText || !toText) {
      alert("Please enter both From and To locations");
      return;
    }

    setGeocoding(true);
    const fromCoords = await geocode(fromText);
    const toCoords = await geocode(toText);
    setGeocoding(false);

    if (!fromCoords) { alert(`Could not find location: ${fromText}`); return; }
    if (!toCoords) { alert(`Could not find location: ${toText}`); return; }

    setFrom(fromCoords);
    setTo(toCoords);
    setMapCenter([
      (fromCoords.lat + toCoords.lat) / 2,
      (fromCoords.lng + toCoords.lng) / 2,
    ]);

    setLoading(true);
    try {
      const res = await axios.get(`${API}/detections/near-route`, {
        params: {
          lat1: fromCoords.lat, lng1: fromCoords.lng,
          lat2: toCoords.lat, lng2: toCoords.lng,
          radius_km: radius,
        },
      });
      setResult(res.data);
    } catch {
      alert("Failed to check route");
    }
    setLoading(false);
  };

  const routeLine = from && to
    ? [[from.lat, from.lng], [to.lat, to.lng]]
    : null;

  const high = result?.route_potholes.filter((d) => d.confidence_avg > 0.6).length || 0;

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--gray-light)" }}>
      <div style={{ background: "var(--navy)", padding: "40px 48px" }}>
        <h1 style={{ color: "var(--white)", fontSize: 36, fontWeight: 700 }}>Route Checker</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 16 }}>
          Enter your route to see pothole hotspots along the way
        </p>
      </div>

      <div style={{ padding: 48, maxWidth: 1200, margin: "0 auto" }}>
        {/* Input Panel */}
        <div style={{
          background: "var(--white)", borderRadius: 12,
          border: "1px solid var(--border)", padding: 32, marginBottom: 32,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 16, alignItems: "end" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)", marginBottom: 8, letterSpacing: 0.5 }}>
                FROM
              </p>
              <input
                placeholder="e.g. Andheri, Mumbai"
                value={fromText}
                onChange={(e) => setFromText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid var(--border)", borderRadius: 6,
                  fontSize: 14, outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              {from && (
                <p style={{ fontSize: 11, color: "#10B981", marginTop: 4, fontWeight: 600 }}>
                  ✓ {from.display.split(",").slice(0, 2).join(",")}
                </p>
              )}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)", marginBottom: 8, letterSpacing: 0.5 }}>
                TO
              </p>
              <input
                placeholder="e.g. Thane, Mumbai"
                value={toText}
                onChange={(e) => setToText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid var(--border)", borderRadius: 6,
                  fontSize: 14, outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              {to && (
                <p style={{ fontSize: 11, color: "#10B981", marginTop: 4, fontWeight: 600 }}>
                  ✓ {to.display.split(",").slice(0, 2).join(",")}
                </p>
              )}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)", marginBottom: 8, letterSpacing: 0.5 }}>
                RADIUS (km)
              </p>
              <input
                type="number" min="0.5" max="5" step="0.5"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                style={{
                  width: 80, padding: "10px 12px",
                  border: "1px solid var(--border)", borderRadius: 6, fontSize: 14,
                }}
              />
            </div>

            <button
              onClick={handleCheck}
              disabled={loading || geocoding}
              style={{
                background: "var(--amber)", color: "var(--navy)",
                border: "none", borderRadius: 8,
                padding: "11px 28px",
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 700, fontSize: 15,
                cursor: "pointer",
              }}
            >
              {geocoding ? "Finding..." : loading ? "Checking..." : "Check Route"}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32 }}>
            {/* Map */}
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
              <MapContainer center={mapCenter} zoom={11} style={{ height: 500 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {routeLine && (
                  <Polyline positions={routeLine} pathOptions={{ color: "#0A1628", weight: 4, dashArray: "8 4" }} />
                )}

                {from && (
                  <Marker position={[from.lat, from.lng]}>
                    <Popup><strong>From:</strong> {fromText}</Popup>
                  </Marker>
                )}

                {to && (
                  <Marker position={[to.lat, to.lng]}>
                    <Popup><strong>To:</strong> {toText}</Popup>
                  </Marker>
                )}

                {result.route_potholes.map((d) => (
                  <>
                    <Marker key={d.id} position={[d.latitude, d.longitude]} icon={createColoredIcon(severityColor(d.confidence_avg))}>
                      <Popup>
                        <strong>{d.pothole_count} pothole{d.pothole_count !== 1 ? "s" : ""}</strong><br />
                        <span style={{ color: severityColor(d.confidence_avg), fontWeight: 600 }}>
                          {severityLabel(d.confidence_avg)} severity
                        </span><br />
                        <span style={{ fontSize: 12 }}>{d.distance_km}km from route</span>
                      </Popup>
                    </Marker>
                    <Circle
                      key={`c-${d.id}`}
                      center={[d.latitude, d.longitude]}
                      radius={200}
                      pathOptions={{
                        color: severityColor(d.confidence_avg),
                        fillColor: severityColor(d.confidence_avg),
                        fillOpacity: 0.2, weight: 1,
                      }}
                    />
                  </>
                ))}
              </MapContainer>
            </div>

            {/* Summary panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                background: "var(--white)", borderRadius: 12,
                border: "1px solid var(--border)", padding: 24,
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Route Summary</h3>
                <RiskBadge total={result.total} high={high} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
                  {[
                    { label: "Potholes on route", value: result.total },
                    { label: "High severity", value: high, color: "#EF4444" },
                    { label: "Within radius", value: `${radius}km` },
                    { label: "Recommendation", value: result.total === 0 ? "Safe" : high > 2 ? "Avoid" : "Caution" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "var(--gray-light)", borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: color || "var(--navy)", fontFamily: "Space Grotesk, sans-serif" }}>{value}</div>
                      <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: "var(--white)", borderRadius: 12,
                border: "1px solid var(--border)", padding: 24,
                flex: 1, overflowY: "auto", maxHeight: 280,
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Potholes Along Route</h3>
                {result.route_potholes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 32, color: "var(--gray)" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <p style={{ fontWeight: 600 }}>Route looks clear!</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>No reported potholes within {radius}km of your route</p>
                  </div>
                ) : (
                  result.route_potholes.map((d) => (
                    <div key={d.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 0", borderBottom: "1px solid var(--border)",
                    }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{d.pothole_count} pothole{d.pothole_count !== 1 ? "s" : ""}</span>
                        <br />
                        <span style={{ fontSize: 11, color: "var(--gray)", fontFamily: "monospace" }}>
                          {d.distance_km}km from route
                        </span>
                      </div>
                      <span style={{
                        background: severityColor(d.confidence_avg),
                        color: "white", fontSize: 10, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 10,
                      }}>
                        {severityLabel(d.confidence_avg)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {!result && (
          <div style={{
            background: "var(--white)", borderRadius: 12,
            border: "1px solid var(--border)", padding: 80,
            textAlign: "center", color: "var(--gray)",
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🗺️</div>
            <p style={{ fontSize: 18, fontWeight: 600 }}>Enter your route above</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              We'll scan our database for reported potholes within your chosen radius
            </p>
          </div>
        )}
      </div>
    </div>
  );
}