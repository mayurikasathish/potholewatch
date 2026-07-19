import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL;
const PASSWORD = "admin123";


async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
  );
  const data = await res.json();
  return data.display_name || null;
}

function severityLabel(conf) {
  if (conf > 0.6) return "High";
  if (conf > 0.4) return "Medium";
  return "Low";
}

function severityColor(conf) {
  if (conf > 0.6) return "#EF4444";
  if (conf > 0.4) return "#F59E0B";
  return "#10B981";
}

function StatusBadge({ status }) {
  const colors = {
    reported: { bg: "#FEF3C7", text: "#92400E" },
    under_review: { bg: "#DBEAFE", text: "#1E40AF" },
    resolved: { bg: "#D1FAE5", text: "#065F46" },
  };
  const c = colors[status] || colors.reported;
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 10,
      fontFamily: "Space Grotesk, sans-serif",
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {status === "under_review" ? "In Review" : status}
    </span>
  );
}

export default function AuthorityDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [detections, setDetections] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [addresses, setAddresses] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalImages, setModalImages] = useState([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [priorityList, setPriorityList] = useState([]);
  const [activeTab, setActiveTab] = useState("reports");

  const handleLogin = () => {
    if (password === PASSWORD) {
      setAuthed(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const fetchDetections = async () => {
    const res = await axios.get(`${API}/detections`);
    setDetections(res.data);
    const addrs = {};
    for (const d of res.data) {
      const addr = await reverseGeocode(d.latitude, d.longitude);
      addrs[d.id] = addr;
    }
    setAddresses(addrs);

    // Also fetch priority list
    const priorityRes = await axios.get(`${API}/detections/priority`);
    setPriorityList(priorityRes.data);
  };

  useEffect(() => {
    if (authed) fetchDetections();
  }, [authed]);

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdating(id);
    await axios.patch(`${API}/detections/${id}/status?status=${newStatus}`);
    await fetchDetections();
    setUpdating(null);
    toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
  };

  const severityData = [
    { name: "High", value: detections.filter(d => d.confidence_avg > 0.6).length, color: "#EF4444" },
    { name: "Medium", value: detections.filter(d => d.confidence_avg > 0.4 && d.confidence_avg <= 0.6).length, color: "#F59E0B" },
    { name: "Low", value: detections.filter(d => d.confidence_avg <= 0.4).length, color: "#10B981" },
  ];

  const statusData = [
    { name: "Reported", value: detections.filter(d => d.status === "reported").length },
    { name: "In Review", value: detections.filter(d => d.status === "under_review").length },
    { name: "Resolved", value: detections.filter(d => d.status === "resolved").length },
  ];

  const filtered = filterStatus === "all"
    ? detections
    : detections.filter(d => d.status === filterStatus);

  if (!authed) {
    return (
      <div style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--navy)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: 48, width: 380, textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h2 style={{ color: "var(--white)", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Authority Access
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 32 }}>
            This dashboard is restricted to authorized personnel
          </p>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%", padding: "12px 16px",
              borderRadius: 8, border: error ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "var(--white)", fontSize: 15,
              marginBottom: 8, outline: "none",
              fontFamily: "Inter, sans-serif",
            }}
          />
          {error && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button onClick={handleLogin} style={{
            width: "100%", padding: "12px",
            background: "var(--amber)", color: "var(--navy)",
            border: "none", borderRadius: 8,
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700, fontSize: 16, cursor: "pointer",
            marginTop: 8,
          }}>
            Access Dashboard
          </button>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 20 }}>
            Hint: admin123
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--gray-light)" }}>
      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "40px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ color: "var(--white)", fontSize: 36, fontWeight: 700 }}>Authority Dashboard</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 16 }}>
            Manage and prioritize pothole repairs across the city
          </p>
        </div>
        <button onClick={() => setAuthed(false)} style={{
          background: "transparent", color: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 6, padding: "8px 16px",
          fontFamily: "Space Grotesk, sans-serif",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          Sign Out
        </button>
      </div>

      <div style={{ padding: 48, maxWidth: 1200, margin: "0 auto" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
          {[
            { label: "Total Reports", value: detections.length, color: "var(--navy)" },
            { label: "Pending", value: detections.filter(d => d.status === "reported").length, color: "#EF4444" },
            { label: "In Review", value: detections.filter(d => d.status === "under_review").length, color: "#F59E0B" },
            { label: "Resolved", value: detections.filter(d => d.status === "resolved").length, color: "#10B981" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "var(--white)", borderRadius: 12,
              padding: "24px 28px", border: "1px solid var(--border)",
              borderTop: `4px solid ${color}`,
            }}>
              <div style={{ fontSize: 36, fontWeight: 700, color, fontFamily: "Space Grotesk, sans-serif" }}>{value}</div>
              <div style={{ fontSize: 14, color: "var(--gray)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
          <div style={{ background: "var(--white)", borderRadius: 12, padding: 28, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Severity Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "var(--white)", borderRadius: 12, padding: 28, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Status Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--navy)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { key: "reports", label: "All Reports" },
            { key: "priority", label: "🚨 Priority Queue" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: "10px 24px", borderRadius: 8,
              border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
              background: activeTab === key ? "var(--navy)" : "var(--white)",
              color: activeTab === key ? "var(--white)" : "var(--gray)",
              fontFamily: "Space Grotesk, sans-serif",
              border: "1px solid var(--border)",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Reports table */}
        {activeTab === "reports" && (
        <div style={{ background: "var(--white)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{
            padding: "20px 28px", borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>All Reports</h3>
            <div style={{ display: "flex", gap: 8 }}>
              {["all", "reported", "under_review", "resolved"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: "5px 14px", borderRadius: 20,
                  border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: filterStatus === s ? "var(--navy)" : "var(--gray-light)",
                  color: filterStatus === s ? "var(--white)" : "var(--gray)",
                  fontFamily: "Space Grotesk, sans-serif",
                }}>
                  {s === "all" ? "All" : s === "under_review" ? "In Review" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--gray-light)" }}>
                {["ID", "Location", "Potholes", "Reports", "Confidence", "Severity", "Status", "Date", "Image", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "var(--gray)",
                    letterSpacing: 0.5, textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} style={{
                  borderTop: "1px solid var(--border)",
                  background: i % 2 === 0 ? "var(--white)" : "var(--gray-light)",
                }}>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600 }}>#{d.id}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--gray)", maxWidth: 200 }}>
                    {addresses[d.id]
                      ? addresses[d.id].split(",").slice(0, 3).join(",")
                      : `${d.latitude?.toFixed(4)}, ${d.longitude?.toFixed(4)}`}
                    <br />
                    <a
                      href={`https://www.google.com/maps?q=${d.latitude},${d.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, color: "var(--amber)", fontWeight: 600, textDecoration: "none" }}
                    >
                      Open in Maps →
                    </a>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700 }}>{d.pothole_count}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      background: d.reports_count > 1 ? "#FEF3C7" : "var(--gray-light)",
                      color: d.reports_count > 1 ? "#92400E" : "var(--gray)",
                      fontSize: 12, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 10,
                    }}>
                      {d.reports_count} {d.reports_count > 1 ? "citizens" : "citizen"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{Math.round(d.confidence_avg * 100)}%</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ color: severityColor(d.confidence_avg), fontWeight: 700, fontSize: 12 }}>
                      {severityLabel(d.confidence_avg)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}><StatusBadge status={d.status} /></td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--gray)" }}>
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {d.image_path && (
                      <button
                      onClick={async () => {
  const images = [`${API}/${d.image_path}`];
  try {
    const res = await axios.get(`${API}/detections/${d.id}/images`);
    res.data.forEach((img) => images.push(`${API}/${img.image_path}`));
  } catch {}
  setModalImages(images);
  setModalIndex(0);
  setSelectedImage(images[0]);
}}
                        style={{
                          background: "var(--navy)", color: "var(--white)",
                          border: "none", borderRadius: 6,
                          padding: "4px 10px", fontSize: 11,
                          fontWeight: 600, cursor: "pointer",
                          fontFamily: "Space Grotesk, sans-serif",
                        }}
                      >
                        View
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {d.status !== "under_review" && d.status !== "resolved" && (
                        <button
                          onClick={() => handleStatusUpdate(d.id, "under_review")}
                          disabled={updating === d.id}
                          style={{
                            padding: "4px 10px", fontSize: 11, fontWeight: 600,
                            background: "#DBEAFE", color: "#1E40AF",
                            border: "none", borderRadius: 6, cursor: "pointer",
                            fontFamily: "Space Grotesk, sans-serif",
                          }}>
                          Review
                        </button>
                      )}
                      {d.status !== "resolved" && (
                        <button
                          onClick={() => handleStatusUpdate(d.id, "resolved")}
                          disabled={updating === d.id}
                          style={{
                            padding: "4px 10px", fontSize: 11, fontWeight: 600,
                            background: "#D1FAE5", color: "#065F46",
                            border: "none", borderRadius: 6, cursor: "pointer",
                            fontFamily: "Space Grotesk, sans-serif",
                          }}>
                          {updating === d.id ? "..." : "Resolve"}
                        </button>
                      )}
                      {d.status === "resolved" && (
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>✅ Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: "center", color: "var(--gray)" }}>
              No reports found
            </div>
          )}
        </div>
        )}

        {activeTab === "priority" && (
        <div style={{ background: "var(--white)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Priority Queue</h3>
            <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
              Ranked by severity, citizen reports, and days unresolved
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--gray-light)" }}>
                {["Rank", "Priority Score", "Location", "Potholes", "Citizens", "Days Open", "Status", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "var(--gray)",
                    letterSpacing: 0.5, textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priorityList.map((d, i) => (
                <tr key={d.id} style={{
                  borderTop: "1px solid var(--border)",
                  background: i === 0 ? "#FFF5F5" : i === 1 ? "#FFFBF0" : "var(--white)",
                }}>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 700, fontSize: 18,
                      color: i === 0 ? "#EF4444" : i === 1 ? "#F59E0B" : "var(--gray)",
                    }}>
                      #{i + 1}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{
                      background: i === 0 ? "#EF4444" : i === 1 ? "#F59E0B" : "var(--navy)",
                      color: "white", borderRadius: 8,
                      padding: "6px 12px", display: "inline-block",
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 700, fontSize: 16,
                    }}>
                      {d.priority_score}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--gray)", maxWidth: 180 }}>
                    {addresses[d.id]
                      ? addresses[d.id].split(",").slice(0, 2).join(",")
                      : `${d.latitude?.toFixed(4)}, ${d.longitude?.toFixed(4)}`}
                    <br />
                    <a
                      href={`https://www.google.com/maps?q=${d.latitude},${d.longitude}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: "var(--amber)", fontWeight: 600, textDecoration: "none" }}
                    >
                      🗺️ Maps
                    </a>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700 }}>{d.pothole_count}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      background: d.reports_count > 2 ? "#FEF3C7" : "var(--gray-light)",
                      color: d.reports_count > 2 ? "#92400E" : "var(--gray)",
                      fontSize: 12, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 10,
                    }}>
                      {d.reports_count} 👥
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      color: d.days_unresolved > 7 ? "#EF4444" : d.days_unresolved > 3 ? "#F59E0B" : "#10B981",
                      fontWeight: 700, fontSize: 13,
                    }}>
                      {d.days_unresolved}d
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}><StatusBadge status={d.status} /></td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {d.status !== "under_review" && d.status !== "resolved" && (
                        <button
                          onClick={() => handleStatusUpdate(d.id, "under_review")}
                          disabled={updating === d.id}
                          style={{
                            padding: "4px 10px", fontSize: 11, fontWeight: 600,
                            background: "#DBEAFE", color: "#1E40AF",
                            border: "none", borderRadius: 6, cursor: "pointer",
                            fontFamily: "Space Grotesk, sans-serif",
                          }}>
                          Review
                        </button>
                      )}
                      {d.status !== "resolved" && (
                        <button
                          onClick={() => handleStatusUpdate(d.id, "resolved")}
                          disabled={updating === d.id}
                          style={{
                            padding: "4px 10px", fontSize: 11, fontWeight: 600,
                            background: "#D1FAE5", color: "#065F46",
                            border: "none", borderRadius: 6, cursor: "pointer",
                            fontFamily: "Space Grotesk, sans-serif",
                          }}>
                          {updating === d.id ? "..." : "Resolve"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {priorityList.length === 0 && (
            <div style={{ padding: 48, textAlign: "center", color: "var(--gray)" }}>
              No unresolved potholes — great work! 🎉
            </div>
          )}
        </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
  <div
    onClick={() => { setSelectedImage(null); setModalImages([]); }}
    style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 9999,
      cursor: "pointer",
    }}
  >
    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", textAlign: "center" }}>
      <img
        src={modalImages[modalIndex]}
        alt="pothole"
        style={{ maxWidth: "80vw", maxHeight: "70vh", borderRadius: 12 }}
      />

      {/* Image counter */}
      <div style={{ color: "white", marginTop: 12, fontSize: 13 }}>
        {modalIndex + 1} / {modalImages.length}
        {modalIndex === 0 ? " (Main photo)" : " (Supporting photo)"}
      </div>

      {/* Navigation */}
      {modalImages.length > 1 && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
          <button
            onClick={() => setModalIndex((i) => Math.max(0, i - 1))}
            disabled={modalIndex === 0}
            style={{
              padding: "8px 20px", borderRadius: 6,
              background: modalIndex === 0 ? "rgba(255,255,255,0.1)" : "var(--amber)",
              color: modalIndex === 0 ? "rgba(255,255,255,0.3)" : "var(--navy)",
              border: "none", fontWeight: 700, cursor: modalIndex === 0 ? "not-allowed" : "pointer",
            }}
          >← Prev</button>
          <button
            onClick={() => setModalIndex((i) => Math.min(modalImages.length - 1, i + 1))}
            disabled={modalIndex === modalImages.length - 1}
            style={{
              padding: "8px 20px", borderRadius: 6,
              background: modalIndex === modalImages.length - 1 ? "rgba(255,255,255,0.1)" : "var(--amber)",
              color: modalIndex === modalImages.length - 1 ? "rgba(255,255,255,0.3)" : "var(--navy)",
              border: "none", fontWeight: 700,
              cursor: modalIndex === modalImages.length - 1 ? "not-allowed" : "pointer",
            }}
          >Next →</button>
        </div>
      )}

      {/* Thumbnail strip */}
      {modalImages.length > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          {modalImages.map((img, i) => (
            <img
              key={i}
              src={img}
              onClick={() => setModalIndex(i)}
              style={{
                width: 60, height: 45, objectFit: "cover", borderRadius: 4,
                border: i === modalIndex ? "2px solid var(--amber)" : "2px solid transparent",
                cursor: "pointer", opacity: i === modalIndex ? 1 : 0.6,
              }}
            />
          ))}
        </div>
      )}

      {/* Close button */}
      <button
        onClick={() => { setSelectedImage(null); setModalImages([]); }}
        style={{
          position: "absolute", top: -16, right: -16,
          background: "var(--amber)", color: "var(--navy)",
          border: "none", borderRadius: "50%",
          width: 32, height: 32, fontSize: 16,
          fontWeight: 700, cursor: "pointer",
        }}
      >×</button>
    </div>
  </div>
)}
    </div>
  );
}