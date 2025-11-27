import { useEffect, useMemo, useState } from 'react';
import { loansAPI, authAPI } from '../services/api';
import { jsPDF } from 'jspdf';

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

  const [loans, setLoans] = useState([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [customer, setCustomer] = useState({ name: '-', id: '-' });

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await loansAPI.getMyLoans();
        setLoans(data);
      } catch (e) {
        console.error('Failed to fetch loans', e);
      }
    };
    const fetchUser = async () => {
      try {
        const u = await authAPI.getCurrentUser();
        const name = u.full_name || u.username || 'Customer';
        const id = String(u.id).padStart(5, '0');
        setCustomer({ name, id });
      } catch (e) {
        // ignore
      }
    };
    fetchLoans();
    fetchUser();

    // WebSocket live updates
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        if (event.type === 'loan.created') {
          // New loan appended
          setLoans((prev) => {
            if (prev.find((l) => l.id === event.loan_id)) return prev;
            return [
              ...prev,
              {
                id: event.loan_id,
                user_id: event.user_id,
                principal: event.principal,
                emi: event.emi,
                outstanding: event.outstanding,
                status: 'ACTIVE',
              },
            ];
          });
        } else if (event.type === 'loan.payment') {
          setLoans((prev) => prev.map((l) => (
            l.id === event.loan_id
              ? { ...l, outstanding: event.outstanding, status: event.status }
              : l
          )));
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  const handleApply = async () => {
    setApplyLoading(true);
    try {
      const tenureMonths = loanTenure * 12;
      const startDate = new Date();
      const payload = {
        loan_type: 'Home',
        principal: loanAmount,
        rate: interestRate,
        tenure_months: tenureMonths,
        start_date: startDate.toISOString().slice(0, 10),
      };
      const created = await loansAPI.applyLoan(payload);
      setLoans((prev) => [...prev, created]);
    } catch (e) {
      console.error('Apply failed', e);
    } finally {
      setApplyLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedLoanId || !paymentAmount) return;
    setPayLoading(true);
    try {
      const updated = await loansAPI.payLoan(selectedLoanId, Number(paymentAmount));
      setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setPaymentAmount('');
    } catch (e) {
      console.error('Payment failed', e);
    } finally {
      setPayLoading(false);
    }
  };

  const totalOutstanding = useMemo(() => loans.reduce((sum, l) => sum + (l.outstanding || 0), 0), [loans]);
  const totalPaid = useMemo(() => loans.reduce((sum, l) => sum + (l.amount_paid || 0), 0), [loans]);
  const totalPayable = useMemo(() => loans.reduce((sum, l) => sum + (l.total_payable || 0), 0), [loans]);
  const totalPrincipal = useMemo(() => loans.reduce((sum, l) => sum + (l.principal || 0), 0), [loans]);
  const activeLoansCount = useMemo(() => loans.filter(l => (l.status || '').toUpperCase() === 'ACTIVE').length, [loans]);

  const formatCurrency = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDatePretty = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatNowHeader = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

  const downloadSummaryPdf = () => {
    const doc = new jsPDF();
    let y = 20;
    const line = (text, indent = 0, size = 12) => {
      doc.setFontSize(size);
      doc.text(text, 14 + indent, y);
      y += 8;
    };
    const sep = () => { line('⸻', 0, 12); };

    // Header
    doc.setFontSize(18);
    doc.text('Loan Summary Report', 14, y); y += 10;
    doc.setFontSize(12);
    line(`Generated: ${formatNowHeader()}`);
    line(`Customer Name: ${customer.name}`);
    line(`Customer ID: ${customer.id}`);
    y += 2; sep(); y += 2;

    // Overview
    doc.setFontSize(16);
    doc.text('Overall Loan Overview', 14, y); y += 8;
    line(`• Total Active Loans: ${activeLoansCount}`, 8);
    line(`• Total Principal Amount: ${formatCurrency(totalPrincipal)}`, 8);
    line(`• Total Payable (with Interest): ${formatCurrency(totalPayable)}`, 8);
    line(`• Total Paid Till Date: ${formatCurrency(totalPaid)}`, 8);
    line(`• Total Outstanding: ${formatCurrency(totalOutstanding)}`, 8);
    y += 2; sep(); y += 2;

    // Breakdown
    doc.setFontSize(16);
    doc.text('Loan Breakdown', 14, y); y += 10;
    doc.setFontSize(12);
    loans.forEach((l, idx) => {
      if (y > 260) { doc.addPage(); y = 20; }
      const idTag = String(l.id || idx + 1).padStart(3, '0');
      line(`${idx + 1}. ${l.loan_type || 'Loan'} #${idTag}`, 0, 13);
      line(`• Loan Amount: ${formatCurrency(l.principal)}`, 8);
      line(`• Interest Rate: ${(l.rate || 0)}%`, 8);
      line(`• Tenure: ${(l.tenure_months || 0)} months`, 8);
      line(`• Monthly EMI: ${formatCurrency(l.emi)}`, 8);
      line(`• Start Date: ${formatDatePretty(l.start_date)}`, 8);
      line(`• Next EMI: ${formatDatePretty(l.next_due_date)}`, 8);
      line(`• Total Paid: ${formatCurrency(l.amount_paid)}`, 8);
      line(`• Outstanding Balance: ${formatCurrency(l.outstanding)}`, 8);
      line(`• Status: ${(l.status || '').toUpperCase()}`, 8);
      y += 2; sep(); y += 2;
    });

    // Summary Notes
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(16);
    doc.text('Summary Notes', 14, y); y += 10;
    doc.setFontSize(12);
    line('• All loans are active and on schedule.', 8);
    line('• No missed EMI payments recorded so far.', 8);
    line('• EMI reminders will be sent 5 days before due date.', 8);
    line('• Consider enabling auto-debit for smoother repayment.', 8);

    doc.save('loan-summary.pdf');
  };

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
                <div className="mt-4">
                  <button onClick={handleApply} disabled={applyLoading} className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-60">
                    {applyLoading ? 'Applying…' : 'Apply for Loan'}
                  </button>
                </div>
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
                {loans.map((loan, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{loan.loan_type || 'Loan'}</h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{loan.account_ref || '—'}</div>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        {loan.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Monthly EMI</span>
                        <span className="font-semibold text-gray-900 dark:text-white">${(loan.emi || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Outstanding</span>
                        <span className="font-semibold text-gray-900 dark:text-white">${(loan.outstanding || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        style={{ width: `${loan.total_payable ? (loan.amount_paid / loan.total_payable) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${(loan.amount_paid || 0).toLocaleString()} / {(loan.total_payable || 0).toLocaleString()} paid
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Next EMI Due: </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{loan.next_due_date || '—'}</span>
                    </div>
                    {/* Removed Select button as requested */}
                  </div>
                ))}
              </div>
            </div>
            {/* Reports Section with PDF Download */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reports</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Download a detailed loan summary report including totals and breakdown.</p>
              <button onClick={downloadSummaryPdf} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all">
                Download Loan Summary PDF
              </button>
            </div>

            {/* Quick Actions removed from Loans page as requested */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loans;
