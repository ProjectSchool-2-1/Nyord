import { createChart } from "lightweight-charts";
import { useEffect, useRef } from "react";

export default function MultiLiveCharts() {
  const aaplRef = useRef(null);
  const nvdaRef = useRef(null);
  const btcRef = useRef(null);
  const ethRef = useRef(null);

  useEffect(() => {
    const apiKey = "d4p6cipr01qnosac3tbgd4p6cipr01qnosac3tc0";

    function initChart(container, title) {
      if (!container) {
        console.error(`Container is null for ${title}`);
        return null;
      }

      try {
        // Clear container first
        container.innerHTML = '';

        // Add title first
        const titleDiv = document.createElement("div");
        titleDiv.style.color = "white";
        titleDiv.style.fontSize = "16px";
        titleDiv.style.marginBottom = "8px";
        titleDiv.style.fontWeight = "bold";
        titleDiv.innerText = title;
        container.appendChild(titleDiv);

        // Create chart container
        const chartContainer = document.createElement("div");
        container.appendChild(chartContainer);

        const chart = createChart(chartContainer, {
          width: 350,
          height: 220,
          layout: {
            backgroundColor: "#111",
            textColor: "#fff",
          },
          grid: {
            vertLines: { color: "#222" },
            horzLines: { color: "#222" },
          },
          rightPriceScale: {
            borderColor: "#333",
          },
          timeScale: {
            borderColor: "#333",
            timeVisible: true,
          },
        });

        if (!chart || typeof chart.addLineSeries !== 'function') {
          console.error(`Failed to create chart for ${title} - addLineSeries not available`);
          return null;
        }

        const series = chart.addLineSeries({
          color: "#00D4AA",
          lineWidth: 2,
        });
        
        chart.timeScale().fitContent();

        return { chart, series };
      } catch (error) {
        console.error(`Error creating chart for ${title}:`, error);
        return null;
      }
    }

    const aaplChart = initChart(aaplRef.current, "AAPL");
    const nvdaChart = initChart(nvdaRef.current, "NVDA");
    const btcChart = initChart(btcRef.current, "BTC/USD");
    const ethChart = initChart(ethRef.current, "ETH/USD");

    // Check if all charts were created successfully
    if (!aaplChart || !nvdaChart || !btcChart || !ethChart) {
      console.error("One or more charts failed to initialize");
      return;
    }

    // Use mock data instead of API for now to test charts
    let aaplPrice = 195.89;
    let nvdaPrice = 140.25;
    let btcPrice = 43250.00;
    let ethPrice = 2680.00;

    const interval = setInterval(() => {
      try {
        const now = Math.floor(Date.now() / 1000);

        // Generate realistic price movements
        aaplPrice += (Math.random() - 0.5) * 2;
        nvdaPrice += (Math.random() - 0.5) * 3;
        btcPrice += (Math.random() - 0.5) * 100;
        ethPrice += (Math.random() - 0.5) * 20;

        // Update charts with mock data
        aaplChart.series.update({ time: now, value: aaplPrice });
        nvdaChart.series.update({ time: now, value: nvdaPrice });
        btcChart.series.update({ time: now, value: btcPrice });
        ethChart.series.update({ time: now, value: ethPrice });

      } catch (error) {
        console.error('Error updating charts:', error);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      // Clean up charts
      try {
        aaplChart?.chart?.remove();
        nvdaChart?.chart?.remove();
        btcChart?.chart?.remove();
        ethChart?.chart?.remove();
      } catch (error) {
        console.error('Error cleaning up charts:', error);
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-900 rounded-lg">
      <div ref={aaplRef} className="bg-black p-4 rounded-lg border border-gray-700" />
      <div ref={nvdaRef} className="bg-black p-4 rounded-lg border border-gray-700" />
      <div ref={btcRef} className="bg-black p-4 rounded-lg border border-gray-700" />
      <div ref={ethRef} className="bg-black p-4 rounded-lg border border-gray-700" />
    </div>
  );
}