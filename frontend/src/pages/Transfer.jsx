import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI, transactionsAPI } from '../services/api';

const Transfer = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [transferData, setTransferData] = useState({
    sourceAccount: '',
    recipientUser: null,
    recipientAccount: null,
    amount: '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await accountsAPI.getAccounts();
      console.log('Fetched accounts:', data);
      setAccounts(data || []);
      // Don't auto-select to force user to choose
    } catch (e) {
      console.error('Failed to fetch accounts', e);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await transactionsAPI.searchUsers(query);
      setSearchResults(results || []);
      setShowDropdown(true);
    } catch (e) {
      console.error('Failed to search users', e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const selectRecipient = async (user) => {
    setSearchQuery(user.username);
    setShowDropdown(false);
    
    // Fetch recipient's accounts
    try {
      const userAccounts = await accountsAPI.getUserAccounts(user.id);
      if (userAccounts && userAccounts.length > 0) {
        setTransferData(prev => ({
          ...prev,
          recipientUser: user,
          recipientAccount: userAccounts[0].id
        }));
      } else {
        showMessage('error', 'Recipient has no accounts');
      }
    } catch (e) {
      console.error('Failed to fetch recipient accounts', e);
      showMessage('error', 'Failed to load recipient account details');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!transferData.sourceAccount || !transferData.recipientAccount || !transferData.amount) {
      showMessage('error', 'Please fill all fields');
      return;
    }

    const amount = parseFloat(transferData.amount);
    if (isNaN(amount) || amount <= 0) {
      showMessage('error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      await transactionsAPI.createTransaction({
        src_account: parseInt(transferData.sourceAccount),
        dest_account: parseInt(transferData.recipientAccount),
        amount: amount,
      });

      showMessage('success', 'Transfer initiated successfully!');
      
      // Reset form
      setTransferData({
        sourceAccount: accounts[0]?.id || '',
        recipientUser: null,
        recipientAccount: null,
        amount: '',
      });
      setSearchQuery('');
      
      // Refresh accounts to show updated balance
      setTimeout(() => fetchAccounts(), 2000);
    } catch (e) {
      console.error('Transfer failed', e);
      showMessage('error', e.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === parseInt(transferData.sourceAccount));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <span className="material-symbols-outlined mr-2">arrow_back</span>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Transfer Money</h1>
          <p className="text-gray-600 dark:text-gray-400">Send money to other users securely</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-400'
          }`}>
            <div className="flex items-center">
              <span className="material-symbols-outlined mr-2">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* Transfer Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleTransfer} className="space-y-6">
            {/* Source Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Account
              </label>
              <select
                value={transferData.sourceAccount}
                onChange={(e) => setTransferData({ ...transferData, sourceAccount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select an account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={String(acc.id)}>
                    {acc.account_type === 'savings' ? 'Savings' : 'Current'} - {acc.account_number} - Balance: ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Available Balance: ${selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            {/* Recipient Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient Username
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type username to search..."
                required
              />
              
              {/* Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectRecipient(user)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">{user.username}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.full_name || 'No name'} • {user.email}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchLoading && (
                <div className="absolute right-4 top-12 text-gray-400">
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                </div>
              )}

              {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !searchLoading && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              )}
            </div>

            {/* Selected Recipient Info */}
            {transferData.recipientUser && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {transferData.recipientUser.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {transferData.recipientUser.username}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {transferData.recipientUser.full_name || 'No name'} • {transferData.recipientUser.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !transferData.recipientAccount}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Transfer Money'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Transfers Info */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transfer Information</h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start">
              <span className="material-symbols-outlined text-blue-600 mr-3 mt-0.5">info</span>
              <p>Transfers are processed instantly between user accounts</p>
            </div>
            <div className="flex items-start">
              <span className="material-symbols-outlined text-blue-600 mr-3 mt-0.5">security</span>
              <p>All transactions are secured and encrypted</p>
            </div>
            <div className="flex items-start">
              <span className="material-symbols-outlined text-blue-600 mr-3 mt-0.5">schedule</span>
              <p>Transaction history is available in your account statements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
