import { useState, useRef, useEffect } from "react";
import axios from "axios";
import exifr from "exifr";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import L from "leaflet";

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
  );
  const data = await res.json();
  return data.display_name || null;
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API = import.meta.env.VITE_API_URL;;

function SearchControl({ onLocationSelect }) {
  const map = useMap();
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Search for a location...",
    });
    map.addControl(searchControl);
    map.on("geosearch/showlocation", (e) => {
      onLocationSelect(e.location.y, e.location.x);
    });
    return () => map.removeControl(searchControl);
  }, [map, onLocationSelect]);
  return null;
}

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ResultCanvas({ imageFile, result }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!imageFile || !result) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      result.detections.forEach((det) => {
        const { x1, y1, x2, y2 } = det.bbox;
        const conf = det.confidence;
        const color = conf > 0.6 ? "#EF4444" : conf > 0.4 ? "#F59E0B" : "#10B981";
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.fillStyle = color;
        ctx.fillRect(x1, y1 - 24, 110, 24);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.fillText(`Pothole ${Math.round(conf * 100)}%`, x1 + 6, y1 - 6);
      });
    };
    img.src = URL.createObjectURL(imageFile);
  }, [imageFile, result]);
  return (
    <canvas ref={canvasRef} style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)" }} />
  );
}

export default function ReportPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationSource, setLocationSource] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setSupportingFiles([]);

    try {
      const gps = await exifr.gps(f);
      if (gps && gps.latitude && gps.longitude) {
        setLatitude(gps.latitude);
        setLongitude(gps.longitude);
        setLocationSource("exif");
        const addr = await reverseGeocode(gps.latitude, gps.longitude);
        setAddress(addr);
      }
    } catch (err) {
      console.log("No EXIF GPS found in image");
    }
    setStep(2);
  };

  const handleLocationSelect = async (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationSource("manual");
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
  };

  const handleGetCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationSource("gps");
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
      },
      () => toast.error("Could not get location — please allow location access")
    );
  };

  const handleSubmit = async () => {
    if (!file || !latitude || !longitude) {
      toast.error("Please upload an image and set a location");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    supportingFiles.forEach((f) => {
      formData.append("supporting_images", f);
    });
    try {
      const res = await axios.post(`${API}/detect`, formData);
      setResult(res.data);
      setStep(3);
      toast.success(`${res.data.pothole_count} pothole${res.data.pothole_count !== 1 ? "s" : ""} detected!`);
    } catch {
      toast.error("Detection failed — is the backend running?");
    }
    setLoading(false);
  };

  const locationBadge = {
    exif: { label: "📍 Auto-detected from photo GPS", color: "#10B981" },
    gps: { label: "📡 Current GPS location", color: "#3B82F6" },
    manual: { label: "🖱️ Manually pinned on map", color: "#F59E0B" },
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--gray-light)" }}>
      <div style={{ background: "var(--navy)", padding: "40px 48px" }}>
        <h1 style={{ color: "var(--white)", fontSize: 36, fontWeight: 700 }}>Report a Pothole</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 16 }}>
          Upload a photo — GPS is auto-extracted from image metadata when available
        </p>
      </div>

      <div style={{ padding: 48, maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Upload */}
          <div style={{ background: "var(--white)", borderRadius: 12, padding: 32, border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Upload Image</h2>
            <label style={{
              display: "block", border: "2px dashed var(--border)", borderRadius: 8,
              padding: 40, textAlign: "center", cursor: "pointer",
            }}>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
              {preview ? (
                <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6, objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
                  <p style={{ color: "var(--gray)", fontSize: 14 }}>Click to upload a road photo</p>
                  <p style={{ color: "var(--gray)", fontSize: 12, marginTop: 4 }}>
                    GPS coordinates will be auto-extracted if available
                  </p>
                </>
              )}
            </label>

            {locationSource === "exif" && (
              <div style={{
                marginTop: 16, background: "#D1FAE5", border: "1px solid #10B981",
                borderRadius: 8, padding: "10px 16px", fontSize: 13,
                color: "#065F46", fontWeight: 600,
              }}>
                ✅ GPS location auto-detected from photo metadata — high trust
              </div>
            )}

            {/* Supporting images */}
            {preview && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gray)", marginBottom: 8 }}>
                  + Add supporting photos to show surroundings (optional)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSupportingFiles(Array.from(e.target.files))}
                  style={{ fontSize: 13 }}
                />
                {supportingFiles.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {supportingFiles.map((f, i) => (
                      <img
                        key={i}
                        src={URL.createObjectURL(f)}
                        alt="supporting"
                        style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          {step >= 2 && (
            <div style={{ background: "var(--white)", borderRadius: 12, padding: 32, border: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Set Location</h2>
              <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 16 }}>
                Search for a location, click on the map, or use your current GPS
              </p>

              {latitude && (
                <div style={{
                  background: "var(--gray-light)", borderRadius: 8,
                  padding: "10px 16px", marginBottom: 16,
                  display: "flex", alignItems: "flex-start", gap: 8,
                }}>
                  <span style={{ color: locationBadge[locationSource]?.color, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                    {locationBadge[locationSource]?.label}
                  </span>
                  <div>
                    {address && (
                      <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.4 }}>
                        {address}
                      </div>
                    )}
                    <span style={{ fontSize: 11, color: "var(--gray)", fontFamily: "monospace" }}>
                      {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </span>
                  </div>
                </div>
              )}

              <button onClick={handleGetCurrentLocation} style={{
                background: "var(--navy)", color: "var(--white)",
                border: "none", borderRadius: 6, padding: "10px 20px",
                fontFamily: "Space Grotesk, sans-serif", fontWeight: 600,
                fontSize: 14, cursor: "pointer", marginBottom: 16, width: "100%",
              }}>
                📡 Use Current Location
              </button>

              <MapContainer
                center={latitude ? [latitude, longitude] : [19.0760, 72.8777]}
                zoom={latitude ? 14 : 10}
                style={{ height: 260, borderRadius: 8 }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <SearchControl onLocationSelect={handleLocationSelect} />
                <LocationPicker onLocationSelect={handleLocationSelect} />
                {latitude && <Marker position={[latitude, longitude]} />}
              </MapContainer>

              <button onClick={handleSubmit} disabled={loading || !latitude} style={{
                marginTop: 16, width: "100%",
                background: latitude ? "var(--amber)" : "var(--border)",
                color: latitude ? "var(--navy)" : "var(--gray)",
                border: "none", borderRadius: 8, padding: 14,
                fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
                fontSize: 16, cursor: latitude ? "pointer" : "not-allowed",
              }}>
                {loading ? "Detecting potholes..." : "Detect Potholes"}
              </button>
            </div>
          )}
        </div>

        {/* Right — Result */}
        <div>
          {!result ? (
            <div style={{
              background: "var(--white)", borderRadius: 12,
              border: "1px solid var(--border)", padding: 48,
              textAlign: "center", height: "100%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "var(--gray)",
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🕳️</div>
              <p style={{ fontSize: 16, fontWeight: 500 }}>Detection results will appear here</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>Upload a photo and set a location to get started</p>
            </div>
          ) : (
            <div style={{ background: "var(--white)", borderRadius: 12, border: "1px solid var(--border)", padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Detection Result</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Potholes", value: result.pothole_count, color: "#EF4444" },
                  { label: "Avg Confidence", value: `${Math.round(result.confidence_avg * 100)}%`, color: "#F59E0B" },
                  { label: "Status", value: result.status, color: "#10B981" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: "var(--gray-light)", borderRadius: 8,
                    padding: 16, textAlign: "center", borderTop: `3px solid ${color}`,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "Space Grotesk, sans-serif" }}>{value}</div>
                    <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              <ResultCanvas imageFile={file} result={result} />
              <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center" }}>
                {[
                  { color: "#EF4444", label: "High (>60%)" },
                  { color: "#F59E0B", label: "Medium (40-60%)" },
                  { color: "#10B981", label: "Low (<40%)" },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, background: color, borderRadius: 2 }} />
                    <span style={{ fontSize: 12, color: "var(--gray)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}