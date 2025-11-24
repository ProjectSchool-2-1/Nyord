import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ManageCards from './pages/ManageCards';
import AccountStatements from './pages/AccountStatements';
import Loans from './pages/Loans';
import FixedDeposits from './pages/FixedDeposits';
import Stocks from './pages/Stocks';
import Profile from './pages/Profile';
import Help from './pages/Help';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cards" element={<ManageCards />} />
          <Route path="/statements" element={<AccountStatements />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/fixed-deposits" element={<FixedDeposits />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
