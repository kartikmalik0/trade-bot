import { Chart, registerables } from "chart.js";
import "chartjs-chart-financial";
import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register all chart types
Chart.register(...registerables);

// Generate sample candlestick data
const generateSampleData = () => {
  const data: { x: string; o: number; h: number; l: number; c: number }[] = [];
  let price = 100;

  for (let i = 0; i < 20; i++) {
    const open = price;
    const close = open + Math.random() * 10 - 5;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    data.push({
      x: `Day ${i + 1}`,
      o: parseFloat(open.toFixed(2)),
      h: parseFloat(high.toFixed(2)),
      l: parseFloat(low.toFixed(2)),
      c: parseFloat(close.toFixed(2)),
    });

    price = close;
  }

  return data;
};

export async function generateCandlestickChart(): Promise<string> {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);

  new Chart(canvas as any, {
    type: "candlestick" as any,
    data: {
      datasets: [
        {
          label: "Stock Price",
          data: generateSampleData(),
          borderColor: "#4ade80",
          color: {
            up: "#4ade80",
            down: "#ef4444",
            unchanged: "#64748b",
          },
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: 'Sample Candlestick Chart'
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time Period'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Price'
          }
        }
      }
    },
  });

  // Save chart as PNG
  const outputPath = path.join(__dirname, `candlestick_${Date.now()}.png`);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}