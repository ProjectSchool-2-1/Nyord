import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationApiContext';
import { adminAPI } from '../services/api';
import KYCApprovalDashboard from '../components/KYCApprovalDashboard';
import LoanApprovalDashboard from '../components/LoanApprovalDashboard';
import CardApprovalDashboard from '../components/CardApprovalDashboard';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [accountsWithUsers, setAccountsWithUsers] = useState([]);
  const [transactionsWithUsers, setTransactionsWithUsers] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [comprehensiveUserData, setComprehensiveUserData] = useState([]);
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, transactionsRes, accountsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(0, 10),
        adminAPI.getTransactions(0, 10),
        adminAPI.getAccounts(0, 50)
      ]);
      
      setStats(statsRes);
      setUsers(usersRes);
      setTransactions(transactionsRes);
      setAccounts(accountsRes);
      
      // Get all users and additional financial data for comprehensive view
      const [allUsers, cardsData, loansData] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getPendingCards().then(pending => 
          adminAPI.getAllCards ? adminAPI.getAllCards() : pending
        ).catch(() => []),
        adminAPI.getPendingLoans().then(pending => 
          adminAPI.getAllLoans ? adminAPI.getAllLoans() : pending
        ).catch(() => [])
      ]);
      
      // Enrich accounts with user data
      const enrichedAccounts = accountsRes.map(account => {
        const user = allUsers.find(u => u.id === account.user_id);
        return {
          ...account,
          user: user || null
        };
      });
      
      // Enrich transactions with user data
      const enrichedTransactions = transactionsRes.map(transaction => {
        const srcAccount = enrichedAccounts.find(acc => acc.id === transaction.src_account);
        const destAccount = enrichedAccounts.find(acc => acc.id === transaction.dest_account);
        return {
          ...transaction,
          srcUser: srcAccount?.user || null,
          destUser: destAccount?.user || null,
          srcAccountNumber: srcAccount?.account_number || transaction.src_account,
          destAccountNumber: destAccount?.account_number || transaction.dest_account
        };
      });
      
      // Create comprehensive user data with all financial information
      const comprehensiveData = allUsers.map(user => {
        const userAccounts = enrichedAccounts.filter(acc => acc.user_id === user.id);
        const userCards = cardsData.filter(card => card.user_id === user.id);
        const userLoans = loansData.filter(loan => loan.user_id === user.id);
        const userTransactions = enrichedTransactions.filter(txn => 
          userAccounts.some(acc => acc.id === txn.src_account || acc.id === txn.dest_account)
        );
        
        const totalBalance = userAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        const totalLoanAmount = userLoans.reduce((sum, loan) => sum + (loan.principal || 0), 0);
        
        return {
          user,
          accounts: userAccounts,
          cards: userCards,
          loans: userLoans,
          transactions: userTransactions,
          summary: {
            totalBalance,
            totalLoanAmount,
            accountsCount: userAccounts.length,
            cardsCount: userCards.length,
            loansCount: userLoans.length,
            transactionsCount: userTransactions.length
          }
        };
      });
      
      setAccountsWithUsers(enrichedAccounts);
      setTransactionsWithUsers(enrichedTransactions);
      setAllCards(cardsData);
      setAllLoans(loansData);
      setComprehensiveUserData(comprehensiveData);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (accountId, currentBalance) => {
    const amount = prompt(`Current balance: $${currentBalance}\nEnter adjustment amount (use + for credit, - for debit):`);
    if (!amount) return;
    
    const reason = prompt('Enter reason for adjustment:');
    if (!reason) return;
    
    try {
      await adminAPI.adjustBalance(accountId, parseFloat(amount), reason);
      alert('Balance adjusted successfully!');
      loadAdminData(); // Refresh data
    } catch (error) {
      alert('Failed to adjust balance: ' + error.message);
    }
  };

  const handleToggleAccount = async (accountId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this account?`)) return;
    
    try {
      // For now, just show a message since the backend endpoint might not exist
      alert(`Account ${action} functionality would be implemented here`);
      // await adminAPI.toggleAccountStatus(accountId, !currentStatus);
      // loadAdminData(); // Refresh data
    } catch (error) {
      alert(`Failed to ${action} account: ` + error.message);
    }
  };

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleViewAccount = (account) => {
    const accountInfo = `
Account Details:

Account Number: ${account.account_number}
Account ID: ${account.id}
Owner: ${account.user?.full_name || account.user?.username || 'Unknown User'}
Email: ${account.user?.email || 'No email available'}
Type: ${account.account_type || 'Savings'}
Balance: $${account.balance?.toLocaleString() || '0.00'}
Status: ${account.is_active !== false ? 'Active' : 'Inactive'}
Created: ${account.created_at ? new Date(account.created_at).toLocaleDateString() : 'Unknown'}
    `;
    alert(accountInfo);
  };

  const setupAdmin = async () => {
    try {
      const response = await adminAPI.setupAdmin();
      showSuccess(
        'Admin Account Created!',
        `Username: ${response.data.username}, Password: ${response.data.password}`,
        { duration: 10000 }
      );
    } catch (err) {
      showError('Setup Failed', err.message || 'Failed to setup admin');
    }
  };

  // Debug: Log user info to console
  console.log('AdminDashboard - Current user:', user);
  console.log('AdminDashboard - User role:', user?.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user.full_name || user.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <span className="material-symbols-outlined text-xs mr-1">admin_panel_settings</span>
                Administrator
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: 'dashboard' },
              { id: 'kyc', name: 'KYC Approval', icon: 'verified_user' },
              { id: 'loans', name: 'Loan Approvals', icon: 'trending_up' },
              { id: 'cards', name: 'Card Approvals', icon: 'credit_card' },
              { id: 'users', name: 'Users', icon: 'people' },
              { id: 'transactions', name: 'Transactions', icon: 'swap_horiz' },
              { id: 'accounts', name: 'Accounts', icon: 'account_balance' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats.total_users, icon: 'people', color: 'blue' },
                { label: 'Total Accounts', value: stats.total_accounts, icon: 'account_balance', color: 'green' },
                { label: 'Total Balance', value: `$${stats.total_balance.toLocaleString()}`, icon: 'account_balance_wallet', color: 'purple' },
                { label: 'Transactions', value: stats.total_transactions, icon: 'swap_horiz', color: 'orange' },
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-md bg-${stat.color}-100`}>
                      <span className={`material-symbols-outlined text-${stat.color}-600`}>{stat.icon}</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Active Loans', value: stats.total_loans, icon: 'trending_up' },
                { label: 'Fixed Deposits', value: stats.total_fixed_deposits, icon: 'savings' },
                { label: 'Active Cards', value: stats.total_cards, icon: 'credit_card' },
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">{stat.icon}</span>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

     
        {activeTab === 'kyc' && (
          <KYCApprovalDashboard />
        )}

        {/* Loan Approvals Tab */}
        {activeTab === 'loans' && (
          <LoanApprovalDashboard />
        )}

        {/* Card Approvals Tab */}
        {activeTab === 'cards' && (
          <CardApprovalDashboard />
        )}

      
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {(user.full_name || user.username).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name || user.username}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.phone || 'Not provided'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactionsWithUsers.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{transaction.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.srcUser?.full_name || transaction.srcUser?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.srcAccountNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.destUser?.full_name || transaction.destUser?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.destAccountNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'SUCCESS' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Tab - Comprehensive Financial Overview */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Complete Financial Overview - All Users</h3>
                
                {comprehensiveUserData.length === 0 && !loading ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">account_balance</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data Found</h3>
                    <p className="text-gray-500">No users with financial data are currently registered in the system.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comprehensiveUserData.map((userData, index) => {
                      const isExpanded = expandedUsers.has(userData.user.id);
                      return (
                        <div key={userData.user.id} className={`border border-gray-200 rounded-lg bg-white transition-all duration-200 ${isExpanded ? 'shadow-lg' : 'hover:shadow-md'}`}>
                          {/* Clickable User Header */}
                          <div 
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleUserExpansion(userData.user.id)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {userData.user.full_name?.charAt(0)?.toUpperCase() || userData.user.username?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                  {userData.user.full_name || userData.user.username || `User ${userData.user.id}`}
                                  <span className="material-symbols-outlined ml-2 text-gray-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }">expand_more</span>
                                </h4>
                                <p className="text-sm text-gray-500">{userData.user.email || 'No email'}</p>
                                <div className="flex space-x-4 text-xs text-gray-400 mt-1">
                                  <span>{userData.summary.accountsCount} accounts</span>
                                  <span>{userData.summary.cardsCount} cards</span>
                                  <span>{userData.summary.loansCount} loans</span>
                                  <span>{userData.summary.transactionsCount} transactions</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                ${userData.summary.totalBalance.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">Total Balance</div>
                              <div className="text-xs text-blue-600 mt-1">
                                {isExpanded ? 'Click to collapse' : 'Click to expand'}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details - Only show when user is expanded */}
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                              {/* Summary Cards */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-4">
                                <div className="bg-white rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-2xl font-bold text-blue-600">{userData.summary.accountsCount}</div>
                                      <div className="text-sm text-gray-500">Accounts</div>
                                    </div>
                                    <span className="material-symbols-outlined text-blue-500">account_balance</span>
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-purple-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-2xl font-bold text-purple-600">{userData.summary.cardsCount}</div>
                                      <div className="text-sm text-gray-500">Cards</div>
                                    </div>
                                    <span className="material-symbols-outlined text-purple-500">credit_card</span>
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-orange-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-2xl font-bold text-orange-600">{userData.summary.loansCount}</div>
                                      <div className="text-sm text-gray-500">Loans</div>
                                    </div>
                                    <span className="material-symbols-outlined text-orange-500">trending_up</span>
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-2xl font-bold text-green-600">{userData.summary.transactionsCount}</div>
                                      <div className="text-sm text-gray-500">Transactions</div>
                                    </div>
                                    <span className="material-symbols-outlined text-green-500">swap_horiz</span>
                                  </div>
                                </div>
                              </div>

                        {/* Detailed Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Accounts Section */}
                          <div className="bg-white rounded-lg border">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h5 className="text-md font-medium text-gray-900 flex items-center">
                                <span className="material-symbols-outlined mr-2 text-blue-500">account_balance</span>
                                Accounts ({userData.accounts.length})
                              </h5>
                            </div>
                            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                              {userData.accounts.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No accounts</p>
                              ) : (
                                userData.accounts.map(account => (
                                  <div key={account.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium">{account.account_number}</div>
                                      <div className="text-xs text-gray-500">{account.account_type || 'Savings'}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold text-green-600">
                                        ${account.balance?.toLocaleString() || '0.00'}
                                      </div>
                                      <div className={`text-xs ${
                                        account.is_active !== false ? 'text-green-500' : 'text-red-500'
                                      }`}>
                                        {account.is_active !== false ? 'Active' : 'Inactive'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Cards Section */}
                          <div className="bg-white rounded-lg border">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h5 className="text-md font-medium text-gray-900 flex items-center">
                                <span className="material-symbols-outlined mr-2 text-purple-500">credit_card</span>
                                Cards ({userData.cards.length})
                              </h5>
                            </div>
                            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                              {userData.cards.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No cards</p>
                              ) : (
                                userData.cards.map(card => (
                                  <div key={card.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium">{card.card_number || 'Card'}</div>
                                      <div className="text-xs text-gray-500">{card.card_type || 'Credit'}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        card.status === 'active' ? 'bg-green-100 text-green-800' :
                                        card.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {card.status || 'Pending'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Loans Section */}
                          <div className="bg-white rounded-lg border">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h5 className="text-md font-medium text-gray-900 flex items-center">
                                <span className="material-symbols-outlined mr-2 text-orange-500">trending_up</span>
                                Loans ({userData.loans.length})
                              </h5>
                            </div>
                            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                              {userData.loans.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No loans</p>
                              ) : (
                                userData.loans.map(loan => (
                                  <div key={loan.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium">${loan.principal?.toLocaleString() || '0'}</div>
                                      <div className="text-xs text-gray-500">{loan.purpose || 'General'} • {loan.duration_months}m</div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {loan.status || 'Pending'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Recent Transactions Section */}
                          <div className="bg-white rounded-lg border">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h5 className="text-md font-medium text-gray-900 flex items-center">
                                <span className="material-symbols-outlined mr-2 text-green-500">swap_horiz</span>
                                Recent Transactions ({userData.transactions.slice(0, 5).length})
                              </h5>
                            </div>
                            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                              {userData.transactions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No transactions</p>
                              ) : (
                                userData.transactions.slice(0, 5).map(txn => (
                                  <div key={txn.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium">${txn.amount?.toLocaleString() || '0'}</div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(txn.timestamp).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        txn.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                        txn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {txn.status || 'Unknown'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                              {/* Quick Actions */}
                              <div className="mt-6 flex flex-wrap gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewAccount(userData.accounts[0]);
                                  }}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
                                  disabled={userData.accounts.length === 0}
                                >
                                  View Details
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    userData.accounts[0] && handleAdjustBalance(userData.accounts[0].id, userData.summary.totalBalance);
                                  }}
                                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
                                  disabled={userData.accounts.length === 0}
                                >
                                  Adjust Balance
                                </button>
                                <button 
                                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert(`Financial Statement for ${userData.user.full_name || userData.user.username}\n\nTotal Balance: $${userData.summary.totalBalance.toLocaleString()}\nAccounts: ${userData.summary.accountsCount}\nCards: ${userData.summary.cardsCount}\nLoans: ${userData.summary.loansCount}\nTransactions: ${userData.summary.transactionsCount}`);
                                  }}
                                >
                                  Generate Statement
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;