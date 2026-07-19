import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function StatusStep({ label, description, done, active }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: done ? "#10B981" : active ? "var(--amber)" : "rgba(255,255,255,0.1)",
          border: active ? "2px solid var(--amber)" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700,
          color: done || active ? "white" : "rgba(255,255,255,0.3)",
          flexShrink: 0,
        }}>
          {done ? "✓" : active ? "●" : "○"}
        </div>
      </div>
      <div style={{ paddingBottom: 32 }}>
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: done ? "#10B981" : active ? "var(--amber)" : "rgba(255,255,255,0.3)",
          fontFamily: "Space Grotesk, sans-serif",
        }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          {description}
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  const { reference_id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/track/${reference_id}`)
      .then((res) => {
        if (res.data.error) setError(true);
        else setData(res.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [reference_id]);

  const steps = [
    {
      label: "Reported",
      description: "Your report has been received and logged in our system",
      done: ["reported", "under_review", "resolved"].includes(data?.status),
      active: data?.status === "reported",
    },
    {
      label: "Under Review",
      description: "Authorities have acknowledged the issue and are planning repair",
      done: ["under_review", "resolved"].includes(data?.status),
      active: data?.status === "under_review",
    },
    {
      label: "Resolved",
      description: "The pothole has been repaired — thank you for reporting!",
      done: data?.status === "resolved",
      active: false,
    },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--navy)" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "64px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🕳️</div>
          <h1 style={{ color: "var(--white)", fontSize: 32, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}>
            Track Your Report
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
            Reference ID: <span style={{ color: "var(--amber)", fontWeight: 700, fontFamily: "monospace" }}>{reference_id}</span>
          </p>
        </div>

        {loading && (
          <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>Loading...</p>
        )}

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid #EF4444",
            borderRadius: 12, padding: 32, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
            <p style={{ color: "#EF4444", fontWeight: 600, fontSize: 16 }}>Reference ID not found</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8 }}>
              Check the ID and try again
            </p>
            <Link to="/report" style={{
              display: "inline-block", marginTop: 20,
              background: "var(--amber)", color: "var(--navy)",
              padding: "10px 24px", borderRadius: 8,
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700, textDecoration: "none",
            }}>
              Report a New Pothole
            </Link>
          </div>
        )}

        {data && (
          <>
            {/* Stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16, marginBottom: 40,
            }}>
              {[
                { label: "Potholes", value: data.pothole_count, color: "#EF4444" },
                { label: "Citizens Reported", value: data.reports_count, color: "var(--amber)" },
                { label: "Days Open", value: data.status === "resolved" ? "Fixed!" : `${data.days_unresolved}d`, color: data.status === "resolved" ? "#10B981" : data.days_unresolved > 14 ? "#EF4444" : "var(--amber)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, padding: "20px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "Space Grotesk, sans-serif" }}>{value}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: 32, marginBottom: 32,
            }}>
              <h3 style={{ color: "var(--white)", fontSize: 16, fontWeight: 700, marginBottom: 24, fontFamily: "Space Grotesk, sans-serif" }}>
                Repair Status
              </h3>
              {steps.map((step, i) => (
                <StatusStep key={i} {...step} />
              ))}
            </div>

            {/* Location */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: 24,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 4 }}>REPORTED LOCATION</p>
                <p style={{ color: "var(--white)", fontSize: 13, fontFamily: "monospace" }}>
                  {data.latitude?.toFixed(5)}, {data.longitude?.toFixed(5)}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                target="_blank" rel="noreferrer"
                style={{
                  background: "var(--amber)", color: "var(--navy)",
                  padding: "8px 16px", borderRadius: 6,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700, fontSize: 13, textDecoration: "none",
                }}
              >
                View on Maps
              </a>
            </div>

            {data.status !== "resolved" && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", marginTop: 24 }}>
                Bookmark this page to check back on your report's progress
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
