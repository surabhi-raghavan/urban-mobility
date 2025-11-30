// src/components/resilience/ResilienceCharts.jsx
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

export function ResilienceTrendLine({ history }) {
  if (!history || history.length === 0)
    return <p>No trend data yet. Run several simulations.</p>;

  const labels = history.map((h, i) => `Run ${i + 1}`);
  const values = history.map((h) => h.resilience);

  return (
    <div style={{ background: "white", padding: "1rem", borderRadius: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>Resilience Trend</h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Resilience (%)",
              data: values,
              tension: 0.3,
            },
          ],
        }}
        options={{ responsive: true }}
      />
    </div>
  );
}

export function CityRankingChart({ rankings }) {
  if (!rankings || rankings.length === 0) return <p>No ranking data yet.</p>;

  const labels = rankings.map((r) => r.city);
  const values = rankings.map((r) => r.resilience);

  return (
    <div style={{ background: "white", padding: "1rem", borderRadius: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>City Resilience Ranking</h3>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Resilience",
              data: values,
            },
          ],
        }}
      />
    </div>
  );
}
