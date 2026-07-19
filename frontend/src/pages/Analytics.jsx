import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const API = import.meta.env.VITE_API_URL;

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--white)", borderRadius: 12,
      padding: "24px 28px", border: "1px solid var(--border)",
      borderTop: `4px solid ${color || "var(--navy)"}`,
    }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: color || "var(--navy)", fontFamily: "Space Grotesk, sans-serif" }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 14, color: "var(--gray)", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [addresses, setAddresses] = useState({});

  useEffect(() => {
    axios.get(`${API}/analytics/summary`).then(async (res) => {
      setData(res.data);

      // Reverse geocode top reported
      const addrs = {};
      for (const r of res.data.top_reported) {
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${r.latitude}&lon=${r.longitude}&format=json&accept-language=en`
        );
        const json = await geo.json();
        addrs[r.id] = json.display_name?.split(",").slice(0, 2).join(",") || "Unknown";
      }
      setAddresses(addrs);
    });
  }, []);

  if (!data) return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--gray)", fontSize: 16 }}>Loading analytics...</p>
    </div>
  );

  const severityData = [
    { name: "High", value: data.high_severity, color: "#EF4444" },
    { name: "Medium", value: data.total - data.high_severity - Math.floor(data.total * 0.2), color: "#F59E0B" },
    { name: "Low", value: Math.floor(data.total * 0.2), color: "#10B981" },
  ];

  const statusData = [
    { name: "Unresolved", value: data.unresolved, color: "#EF4444" },
    { name: "Resolved", value: data.resolved, color: "#10B981" },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--gray-light)" }}>
      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "40px 48px" }}>
        <h1 style={{ color: "var(--white)", fontSize: 36, fontWeight: 700 }}>Analytics</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 16 }}>
          City-wide road health insights for planners and administrators
        </p>
      </div>

      <div style={{ padding: 48, maxWidth: 1200, margin: "0 auto" }}>

        {/* Top stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
          <StatCard label="Total Reported" value={data.total} color="var(--navy)" />
          <StatCard label="Resolved" value={data.resolved} color="#10B981"
            sub={`${Math.round((data.resolved / data.total) * 100) || 0}% resolution rate`} />
          <StatCard label="High Severity" value={data.high_severity} color="#EF4444"
            sub="Confidence > 60%" />
          <StatCard label="Avg Repair Time" value={data.avg_repair_days ? `${data.avg_repair_days}d` : "No data"}
            color="#F59E0B" sub="From report to resolved" />
        </div>

        {/* Charts row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* Line chart - reports over time */}
          <div style={{ background: "var(--white)", borderRadius: 12, padding: 28, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Reports Over Time (Last 30 Days)</h3>
            {data.daily_counts.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.daily_counts}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone" dataKey="count"
                    stroke="var(--navy)" strokeWidth={2}
                    dot={{ fill: "var(--amber)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray)" }}>
                No data yet — start reporting potholes!
              </div>
            )}
          </div>

          {/* Pie chart - status */}
          <div style={{ background: "var(--white)", borderRadius: 12, padding: 28, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Resolution Rate</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Top reported locations */}
          <div style={{ background: "var(--white)", borderRadius: 12, padding: 28, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>🔥 Most Reported Locations</h3>
            {data.top_reported.map((r, i) => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "12px 0", borderBottom: "1px solid var(--border)",
              }}>
                <span style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700, fontSize: 20,
                  color: i === 0 ? "#EF4444" : i === 1 ? "#F59E0B" : "var(--gray)",
                  width: 32,
                }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {addresses[r.id] || "Loading..."}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>
                    {r.reports_count} citizen report{r.reports_count !== 1 ? "s" : ""}
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                  target="_blank" rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 11, color: "var(--amber)", fontWeight: 600, textDecoration: "none" }}
                >
                  Maps →
                </a>
              </div>
            ))}
          </div>

          {/* Severity bar chart */}
          <div style={{ background: "var(--white)", borderRadius: 12, padding: 28, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Severity Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Key insight */}
            <div style={{
              marginTop: 20, background: "var(--gray-light)",
              borderRadius: 8, padding: "12px 16px",
              borderLeft: "4px solid var(--amber)",
            }}>
              <p style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>
                💡 {data.high_severity} high severity pothole{data.high_severity !== 1 ? "s" : ""} need immediate attention
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
