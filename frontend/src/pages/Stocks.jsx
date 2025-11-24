const Stocks = () => {
  const portfolio = [
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 50, buyPrice: 150.00, currentPrice: 185.50, change: '+23.67%' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 30, buyPrice: 120.00, currentPrice: 142.30, change: '+18.58%' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 40, buyPrice: 300.00, currentPrice: 378.85, change: '+26.28%' },
    { symbol: 'TSLA', name: 'Tesla Inc.', shares: 25, buyPrice: 220.00, currentPrice: 248.50, change: '+12.95%' },
  ];

  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.shares * stock.currentPrice), 0);
  const totalInvestment = portfolio.reduce((sum, stock) => sum + (stock.shares * stock.buyPrice), 0);
  const totalGain = totalValue - totalInvestment;
  const gainPercentage = ((totalGain / totalInvestment) * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Stocks & Investments</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your portfolio and market performance</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-4xl opacity-80">account_balance_wallet</span>
            </div>
            <div className="text-sm opacity-90 mb-1">Portfolio Value</div>
            <div className="text-3xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">trending_up</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Gain/Loss</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              +${totalGain.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400">percent</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Return %</div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">+{gainPercentage}%</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-4xl text-yellow-600 dark:text-yellow-400">show_chart</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Holdings</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{portfolio.length}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Holdings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Holdings</h2>
                <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {portfolio.map((stock, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                          {stock.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{stock.symbol}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">
                          ${stock.currentPrice.toFixed(2)}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">{stock.change}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400 mb-1">Shares</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{stock.shares}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400 mb-1">Avg. Buy Price</div>
                        <div className="font-semibold text-gray-900 dark:text-white">${stock.buyPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400 mb-1">Current Value</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${(stock.shares * stock.currentPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Portfolio Performance</h2>
              
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700/50 rounded-xl">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl text-blue-600 dark:text-blue-400 mb-4">
                    show_chart
                  </span>
                  <div className="text-gray-600 dark:text-gray-400">Weekly Performance Graph</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">+12.5% this week</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Full Platform CTA */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl">rocket_launch</span>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-center">Trade Like a Pro</h2>
              <p className="text-sm opacity-90 mb-6 text-center">
                Access advanced trading tools, real-time data, and expert analysis
              </p>
              <button className="w-full py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-all">
                Go to Full Stocks Platform
              </button>
              
              <div className="mt-6 pt-6 border-t border-white/20 space-y-2 text-sm opacity-90">
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
                  Real-time market data
                </div>
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
                  Advanced charting tools
                </div>
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
                  Expert market insights
                </div>
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
                  Zero commission trades
                </div>
              </div>
            </div>

            {/* Market Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Market Trends</h2>
              
              <div className="space-y-4">
                {[
                  { name: 'S&P 500', value: '4,783.45', change: '+1.2%', positive: true },
                  { name: 'NASDAQ', value: '15,032.10', change: '+1.8%', positive: true },
                  { name: 'DOW JONES', value: '37,545.33', change: '-0.3%', positive: false },
                ].map((index, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{index.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{index.value}</div>
                    </div>
                    <div className={`font-bold ${index.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {index.change}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined mr-2">add</span>
                  Buy Stocks
                </button>
                <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined mr-2">sell</span>
                  Sell Holdings
                </button>
                <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined mr-2">notifications</span>
                  Set Price Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stocks;
