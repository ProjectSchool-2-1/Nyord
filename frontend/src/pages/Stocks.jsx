import { useEffect, useState } from "react";

export default function Stocks() {
  const [aapl, setAapl] = useState(null);
  const [nvda, setNvda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const [aaplResponse, nvdaResponse] = await Promise.all([
          fetch("http://localhost:8000/stocks/AAPL"),
          fetch("http://localhost:8000/stocks/NVDA")
        ]);

        const aaplData = await aaplResponse.json();
        const nvdaData = await nvdaResponse.json();

        setAapl(aaplData.price);
        setNvda(nvdaData.price);
        setError(null);
      } catch (err) {
        setError("Failed to fetch stock data");
        console.error("Stock fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStockData();

    // Set up interval for real-time updates
    const interval = setInterval(fetchStockData, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "Loading...";
    return `$${price.toFixed(2)}`;
  };

  const getPriceColor = (price) => {
    if (price === null || price === undefined) return "text-gray-500";
    return "text-green-600";
  };

  if (loading && aapl === null && nvda === null) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Real-Time Stocks</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Real-Time Stocks</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AAPL Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Apple Inc.</h2>
                <p className="text-sm text-gray-600">AAPL</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getPriceColor(aapl)}`}>
                  {formatPrice(aapl)}
                </p>
                <p className="text-xs text-gray-500">Real-time</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Data</span>
              </div>
            </div>
          </div>

          {/* NVDA Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">NVIDIA Corporation</h2>
                <p className="text-sm text-gray-600">NVDA</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getPriceColor(nvda)}`}>
                  {formatPrice(nvda)}
                </p>
                <p className="text-xs text-gray-500">Real-time</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Data</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><strong>Data Source:</strong> Finnhub.io</p>
              <p><strong>Update Frequency:</strong> Real-time</p>
            </div>
            <div>
              <p><strong>Market:</strong> NASDAQ</p>
              <p><strong>Currency:</strong> USD</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}