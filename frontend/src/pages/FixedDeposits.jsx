const FixedDeposits = () => {
  const fixedDeposits = [
    { id: 'FD001', amount: 100000, rate: 7.5, startDate: '2024-01-01', maturityDate: '2025-01-01', tenure: 12, status: 'Active' },
    { id: 'FD002', amount: 250000, rate: 8.2, startDate: '2023-11-15', maturityDate: '2025-11-15', tenure: 24, status: 'Active' },
    { id: 'FD003', amount: 50000, rate: 7.0, startDate: '2024-01-10', maturityDate: '2024-07-10', tenure: 6, status: 'Active' },
    { id: 'FD004', amount: 150000, rate: 8.5, startDate: '2023-06-01', maturityDate: '2026-06-01', tenure: 36, status: 'Active' },
  ];

  const calculateMaturityAmount = (principal, rate, tenure) => {
    return principal * Math.pow((1 + rate / 400), 4 * (tenure / 12));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fixed Deposits</h1>
          <p className="text-gray-600 dark:text-gray-400">Grow your savings with guaranteed returns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-4xl opacity-80">savings</span>
            </div>
            <div className="text-sm opacity-90 mb-1">Total Investment</div>
            <div className="text-3xl font-bold">$550,000</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">trending_up</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expected Returns</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">$68,425</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400">percent</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Average Interest</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">7.8%</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-4xl text-yellow-600 dark:text-yellow-400">schedule</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active FDs</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">4</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FD List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Fixed Deposits</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all">
                  <span className="material-symbols-outlined text-sm mr-1">add</span>
                  New FD
                </button>
              </div>
              
              <div className="space-y-4">
                {fixedDeposits.map((fd) => (
                  <div key={fd.id} className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">FD Number</div>
                        <div className="font-bold text-gray-900 dark:text-white text-lg">{fd.id}</div>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        {fd.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Principal Amount</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${fd.amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Interest Rate</div>
                        <div className="font-semibold text-green-600 dark:text-green-400">{fd.rate}% p.a.</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Start Date</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{fd.startDate}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Maturity Date</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{fd.maturityDate}</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Maturity Amount</div>
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            ${calculateMaturityAmount(fd.amount, fd.rate, fd.tenure).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-4xl">
                          account_balance_wallet
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 py-2 px-4 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-500 transition-all border border-gray-300 dark:border-gray-500">
                        View Details
                      </button>
                      <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">
                        Renew FD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Interest Rates */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Current Interest Rates</h2>
              
              <div className="space-y-4">
                {[
                  { tenure: '6 months', rate: 7.0 },
                  { tenure: '1 year', rate: 7.5 },
                  { tenure: '2 years', rate: 8.0 },
                  { tenure: '3 years', rate: 8.5 },
                  { tenure: '5 years', rate: 9.0 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{item.tenure}</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">{item.rate}%</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-2">info</span>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Interest rates are subject to change. Lock in your rate by opening an FD today!
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <h2 className="text-xl font-bold mb-4">FD Benefits</h2>
              
              <div className="space-y-3">
                {[
                  { icon: 'shield', text: 'Guaranteed returns' },
                  { icon: 'lock', text: 'Secure investment' },
                  { icon: 'payments', text: 'Flexible tenure' },
                  { icon: 'trending_up', text: 'Competitive rates' },
                  { icon: 'account_balance', text: 'Loan against FD' },
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="material-symbols-outlined mr-3 bg-white/20 p-2 rounded-lg">{benefit.icon}</span>
                    <span className="opacity-90">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculator */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">FD Calculator</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Calculate your returns before investing
              </p>
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all">
                Calculate Returns
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedDeposits;
