import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function StatusBadge({ status }) {
  const colors = {
    reported: { bg: "#FEF3C7", text: "#92400E", label: "Reported" },
    under_review: { bg: "#DBEAFE", text: "#1E40AF", label: "Under Review" },
    resolved: { bg: "#D1FAE5", text: "#065F46", label: "Resolved" },
  };
  const c = colors[status] || colors.reported;
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700,
      padding: "4px 12px", borderRadius: 12,
      fontFamily: "Space Grotesk, sans-serif",
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {c.label}
    </span>
  );
}

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("myReports") || "[]");

    if (savedIds.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch details for each saved report
    Promise.all(
      savedIds.map((id) =>
        axios.get(`${API}/track/${id}`)
          .then((res) => res.data.error ? null : res.data)
          .catch(() => null)
      )
    ).then((results) => {
      setReports(results.filter(Boolean).sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      ));
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all"
    ? reports
    : reports.filter((r) => r.status === filter);

  const stats = {
    total: reports.length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    pending: reports.filter((r) => r.status !== "resolved").length,
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--gray-light)" }}>
      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "40px 48px" }}>
        <h1 style={{ color: "var(--white)", fontSize: 36, fontWeight: 700 }}>My Reports</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 16 }}>
          Track all your pothole reports in one place
        </p>
      </div>

      <div style={{ padding: 48, maxWidth: 900, margin: "0 auto" }}>

        {loading && (
          <p style={{ textAlign: "center", color: "var(--gray)" }}>Loading your reports...</p>
        )}

        {!loading && reports.length === 0 && (
          <div style={{
            background: "var(--white)", borderRadius: 12,
            border: "1px solid var(--border)", padding: 64,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🕳️</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No reports yet</h2>
            <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 24 }}>
              Your reported potholes will appear here
            </p>
            <Link to="/report" style={{
              display: "inline-block",
              background: "var(--amber)", color: "var(--navy)",
              padding: "12px 28px", borderRadius: 8,
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700, fontSize: 15,
              textDecoration: "none",
            }}>
              Report Your First Pothole
            </Link>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
              {[
                { label: "Total Reports", value: stats.total, color: "var(--navy)" },
                { label: "Pending", value: stats.pending, color: "#F59E0B" },
                { label: "Resolved", value: stats.resolved, color: "#10B981" },
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

            {/* Filters */}
            <div style={{
              background: "var(--white)", borderRadius: 12,
              border: "1px solid var(--border)", padding: "20px 28px",
              marginBottom: 24, display: "flex", gap: 8,
            }}>
              {["all", "reported", "under_review", "resolved"].map((s) => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: "6px 16px", borderRadius: 20,
                  border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: filter === s ? "var(--navy)" : "var(--gray-light)",
                  color: filter === s ? "var(--white)" : "var(--gray)",
                  fontFamily: "Space Grotesk, sans-serif",
                }}>
                  {s === "all" ? "All" : s === "under_review" ? "Under Review" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Reports List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.map((report) => (
                <div key={report.reference_id} style={{
                  background: "var(--white)", borderRadius: 12,
                  border: "1px solid var(--border)", padding: 24,
                  display: "flex", alignItems: "center", gap: 24,
                }}>
                  <div style={{
                    fontSize: 48,
                    flexShrink: 0,
                  }}>
                    {report.status === "resolved" ? "✅" : "🕳️"}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h3 style={{
                        fontSize: 18, fontWeight: 700,
                        fontFamily: "Space Grotesk, monospace",
                        color: "var(--navy)",
                      }}>
                        {report.reference_id}
                      </h3>
                      <StatusBadge status={report.status} />
                    </div>

                    <div style={{ display: "flex", gap: 24, marginBottom: 4 }}>
                      <p style={{ fontSize: 13, color: "var(--gray)" }}>
                        <strong>{report.pothole_count}</strong> pothole{report.pothole_count !== 1 ? "s" : ""}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--gray)" }}>
                        <strong>{report.reports_count}</strong> citizen report{report.reports_count !== 1 ? "s" : ""}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--gray)" }}>
                        {report.status === "resolved" ? (
                          <span style={{ color: "#10B981", fontWeight: 600 }}>✓ Fixed!</span>
                        ) : (
                          <span>{report.days_unresolved} days open</span>
                        )}
                      </p>
                    </div>

                    <p style={{ fontSize: 12, color: "var(--gray)", fontFamily: "monospace" }}>
                      {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                    </p>
                  </div>

                  <Link to={`/track/${report.reference_id}`} style={{
                    background: "var(--navy)", color: "var(--white)",
                    padding: "10px 20px", borderRadius: 8,
                    fontFamily: "Space Grotesk, sans-serif",
                    fontWeight: 600, fontSize: 14,
                    textDecoration: "none", flexShrink: 0,
                  }}>
                    View Details
                  </Link>
                </div>
              ))}

              {filtered.length === 0 && (
                <div style={{
                  background: "var(--white)", borderRadius: 12,
                  border: "1px solid var(--border)", padding: 48,
                  textAlign: "center", color: "var(--gray)",
                }}>
                  No reports match this filter
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
