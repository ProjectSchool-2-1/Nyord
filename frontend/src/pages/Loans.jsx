import { useState } from 'react';

const Loans = () => {
  const [loanAmount, setLoanAmount] = useState(250000);
  const [loanTenure, setLoanTenure] = useState(20);
  const [interestRate, setInterestRate] = useState(7.5);

  const calculateEMI = () => {
    const principal = loanAmount;
    const ratePerMonth = interestRate / 12 / 100;
    const tenure = loanTenure * 12;
    const emi = (principal * ratePerMonth * Math.pow(1 + ratePerMonth, tenure)) / (Math.pow(1 + ratePerMonth, tenure) - 1);
    return emi.toFixed(2);
  };

  const activeLoans = [
    { type: 'Home Loan', account: '****6789', emi: 18450.00, outstanding: 2150000, paid: 350000, total: 2500000, dueDate: 'Feb 5, 2024' },
    { type: 'Personal Loan', account: '****4523', emi: 5200.00, outstanding: 145000, paid: 55000, total: 200000, dueDate: 'Feb 8, 2024' },
    { type: 'Auto Loan', account: '****8901', emi: 12300.00, outstanding: 480000, paid: 220000, total: 700000, dueDate: 'Feb 10, 2024' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Loans</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your loans and calculate EMI</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Loan Calculator */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
              <h2 className="text-2xl font-bold mb-6">EMI Calculator</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm opacity-90">Loan Amount</label>
                    <span className="font-semibold">${loanAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="10000000"
                    step="10000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs opacity-75 mt-1">
                    <span>$50K</span>
                    <span>$10M</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm opacity-90">Loan Tenure</label>
                    <span className="font-semibold">{loanTenure} years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(Number(e.target.value))}
                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs opacity-75 mt-1">
                    <span>1 year</span>
                    <span>30 years</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm opacity-90">Interest Rate</label>
                    <span className="font-semibold">{interestRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs opacity-75 mt-1">
                    <span>5%</span>
                    <span>20%</span>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mt-6">
                  <div className="text-sm opacity-90 mb-2">Your Monthly EMI</div>
                  <div className="text-4xl font-bold">${calculateEMI()}</div>
                  <div className="text-sm opacity-75 mt-2">
                    Total Interest: ${((calculateEMI() * loanTenure * 12) - loanAmount).toFixed(2)}
                  </div>
                </div>

                <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all">
                  Apply for Loan
                </button>
              </div>
            </div>

            {/* Loan Types */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Available Loan Types</h2>
              
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: 'home', name: 'Home Loan', rate: '6.5% - 8.5%', tenure: 'Up to 30 years', color: 'blue' },
                  { icon: 'person', name: 'Personal Loan', rate: '10% - 15%', tenure: 'Up to 5 years', color: 'purple' },
                  { icon: 'directions_car', name: 'Auto Loan', rate: '7% - 12%', tenure: 'Up to 7 years', color: 'green' },
                ].map((loan, idx) => (
                  <div key={idx} className={`p-6 rounded-xl bg-${loan.color}-50 dark:bg-${loan.color}-900/20 hover:shadow-lg transition-all cursor-pointer`}>
                    <div className={`w-12 h-12 bg-${loan.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                      <span className="material-symbols-outlined text-white text-2xl">{loan.icon}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{loan.name}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="mb-1">Rate: {loan.rate}</div>
                      <div>Tenure: {loan.tenure}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Loans */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Active Loans</h2>
              
              <div className="space-y-4">
                {activeLoans.map((loan, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{loan.type}</h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{loan.account}</div>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        Active
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Monthly EMI</span>
                        <span className="font-semibold text-gray-900 dark:text-white">${loan.emi.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Outstanding</span>
                        <span className="font-semibold text-gray-900 dark:text-white">${loan.outstanding.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        style={{ width: `${(loan.paid / loan.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${loan.paid.toLocaleString()} / ${loan.total.toLocaleString()} paid
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Next EMI Due: </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{loan.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-left">
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-3">payments</span>
                    <span className="font-medium text-gray-900 dark:text-white">Make Payment</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all text-left">
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 mr-3">receipt_long</span>
                    <span className="font-medium text-gray-900 dark:text-white">View Statements</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all text-left">
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 mr-3">support_agent</span>
                    <span className="font-medium text-gray-900 dark:text-white">Contact Support</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loans;
