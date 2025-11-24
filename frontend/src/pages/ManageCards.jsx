import { useState } from 'react';

const ManageCards = () => {
  const [activeCard, setActiveCard] = useState(0);

  const cards = [
    {
      type: 'Premium',
      number: '4532 **** **** 4829',
      holder: 'JOHN DOE',
      expiry: '12/26',
      cvv: '***',
      gradient: 'from-blue-600 to-blue-800',
      balance: 12450.00,
    },
    {
      type: 'Platinum',
      number: '5678 **** **** 8192',
      holder: 'JOHN DOE',
      expiry: '09/25',
      cvv: '***',
      gradient: 'from-purple-600 to-pink-600',
      balance: 8230.00,
    },
    {
      type: 'Gold',
      number: '9012 **** **** 3476',
      holder: 'JOHN DOE',
      expiry: '03/27',
      cvv: '***',
      gradient: 'from-yellow-600 to-orange-600',
      balance: 5820.00,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Cards</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your cards and settings</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Card Display */}
          <div className="lg:col-span-2 space-y-8">
            {/* Card Carousel */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-full sm:w-96 h-56 bg-gradient-to-br ${card.gradient} rounded-2xl shadow-2xl p-6 text-white cursor-pointer transform transition-all hover:scale-105 snap-center ${
                      activeCard === idx ? 'ring-4 ring-blue-400 ring-offset-4 dark:ring-offset-gray-900' : ''
                    }`}
                    onClick={() => setActiveCard(idx)}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className="text-xs opacity-80 mb-1">Card Type</div>
                        <div className="text-lg font-bold">{card.type}</div>
                      </div>
                      <span className="material-symbols-outlined text-4xl">contactless</span>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-2xl font-bold tracking-wider mb-2">{card.number}</div>
                      <div className="text-sm opacity-80">Balance: ${card.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs opacity-80 mb-1">Card Holder</div>
                        <div className="font-semibold text-sm">{card.holder}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-80 mb-1">Expires</div>
                        <div className="font-semibold text-sm">{card.expiry}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-80 mb-1">CVV</div>
                        <div className="font-semibold text-sm">{card.cvv}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="mt-4 w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all">
                <span className="material-symbols-outlined mr-2">add</span>
                Request New Card
              </button>
            </div>

            {/* Card Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Card Details</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Card Number</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{cards[activeCard].number}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Card Type</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{cards[activeCard].type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expiry Date</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{cards[activeCard].expiry}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-semibold">
                    <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                    Active
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Available Credit</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${cards[activeCard].balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">68% of $18,300 limit</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: 'block', label: 'Block Card', color: 'red' },
                  { icon: 'pin', label: 'Change PIN', color: 'blue' },
                  { icon: 'receipt_long', label: 'Statements', color: 'green' },
                  { icon: 'credit_score', label: 'Upgrade Card', color: 'purple' },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    className={`p-4 rounded-xl bg-${action.color}-50 dark:bg-${action.color}-900/20 hover:bg-${action.color}-100 dark:hover:bg-${action.color}-900/30 transition-all text-center`}
                  >
                    <span className={`material-symbols-outlined text-3xl text-${action.color}-600 dark:text-${action.color}-400 mb-2`}>
                      {action.icon}
                    </span>
                    <div className={`text-sm font-medium text-${action.color}-700 dark:text-${action.color}-300`}>
                      {action.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Settings & Transactions */}
          <div className="space-y-6">
            {/* Card Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Card Settings</h2>
              
              <div className="space-y-4">
                {[
                  { label: 'Online Transactions', enabled: true },
                  { label: 'Contactless Payments', enabled: true },
                  { label: 'International Usage', enabled: false },
                  { label: 'ATM Withdrawals', enabled: true },
                  { label: 'Notifications', enabled: true },
                ].map((setting, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{setting.label}</span>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        setting.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          setting.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Transactions</h2>
              
              <div className="space-y-3">
                {[
                  { name: 'Amazon', amount: -89.99, date: 'Today', icon: 'shopping_bag' },
                  { name: 'Starbucks', amount: -12.50, date: 'Yesterday', icon: 'local_cafe' },
                  { name: 'Gas Station', amount: -45.00, date: 'Jan 14', icon: 'local_gas_station' },
                  { name: 'Refund', amount: 25.00, date: 'Jan 13', icon: 'keyboard_return' },
                ].map((txn, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.amount > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <span className={`material-symbols-outlined text-lg ${
                          txn.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {txn.icon}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{txn.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{txn.date}</div>
                      </div>
                    </div>
                    <div className={`font-semibold ${txn.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCards;
