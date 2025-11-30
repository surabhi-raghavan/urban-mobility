// src/components/ml/FeatureImportanceChart.jsx
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function FeatureImportanceChart({ data }) {
  if (!data || data.length === 0) return <p>No feature importance data.</p>;

  const labels = data.map((d) => d.feature);
  const values = data.map((d) => d.importance);

  return (
    <div style={{ background: "white", padding: "1rem", borderRadius: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>Feature Importance</h3>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Importance",
              data: values,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
          },
        }}
      />
    </div>
  );
}
