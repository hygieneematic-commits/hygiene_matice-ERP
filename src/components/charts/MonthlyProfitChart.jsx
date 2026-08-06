import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

export default function MonthlyProfitChart({ labels, data }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: "Net Profit",
        data,
        borderColor: "#4338CA",
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return "rgba(67,56,202,0.1)";
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(67,56,202,0.28)");
          gradient.addColorStop(1, "rgba(6,182,212,0.02)");
          return gradient;
        },
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#4338CA",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0F172A",
        padding: 10,
        cornerRadius: 10,
        titleFont: { family: "Plus Jakarta Sans" },
        bodyFont: { family: "JetBrains Mono" },
        callbacks: { label: (ctx) => `₹${ctx.parsed.y.toLocaleString("en-IN")}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#94A3B8", font: { size: 11 } } },
      y: {
        grid: { color: "#E7EAF3" },
        ticks: { color: "#94A3B8", font: { size: 11 }, callback: (v) => `₹${v / 1000}k` },
      },
    },
  };

  return (
    <div className="h-[260px]">
      <Line data={chartData} options={options} />
    </div>
  );
}
