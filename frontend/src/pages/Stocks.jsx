import MultiLiveCharts from "../components/MultiLiveCharts";

export default function Stocks() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Multi Asset Live Charts
        </h1>
        
        <div className="flex justify-center">
          <MultiLiveCharts />
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Market Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p><strong>Data Source:</strong> Finnhub.io</p>
              <p><strong>Update Frequency:</strong> Real-time (1 second intervals)</p>
              <p><strong>Assets:</strong> AAPL, NVDA, BTC/USD, ETH/USD</p>
            </div>
            <div>
              <p><strong>Markets:</strong> NASDAQ, Crypto</p>
              <p><strong>Currency:</strong> USD</p>
              <p><strong>Note:</strong> Replace YOUR_FINNHUB_API_KEY with actual API key</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}