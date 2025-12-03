import { useState } from 'react';
import { apiRequest } from '../services/api';

const EmailVerification = ({ 
  email, 
  onVerificationSuccess, 
  onVerificationError,
  purpose = "email_verification",
  className = "" 
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const startTimer = () => {
    setTimeLeft(60); // 60 seconds cooldown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setIsSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiRequest('/email/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          purpose: purpose
        })
      });

      if (response.success) {
        setOtpSent(true);
        setSuccess('OTP sent to your email! Please check your inbox.');
        startTimer();
      }
    } catch (err) {
      setError(err.detail || err.message || 'Failed to send OTP');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiRequest('/email/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          otp: otp,
          purpose: purpose
        })
      });

      if (response.success) {
        setSuccess('Email verified successfully!');
        onVerificationSuccess?.(response);
      }
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Invalid OTP';
      setError(errorMessage);
      onVerificationError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtp(value);
      setError('');
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-2xl text-blue-600">mail</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Verification</h3>
        <p className="text-sm text-gray-600">
          We'll send a verification code to <strong>{email}</strong>
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <span className="material-symbols-outlined text-red-500 mr-2 text-sm">error</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <span className="material-symbols-outlined text-green-500 mr-2 text-sm">check_circle</span>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      {!otpSent ? (
        // Send OTP Step
        <div className="space-y-4">
          <button
            onClick={handleSendOTP}
            disabled={isSending || timeLeft > 0}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Sending OTP...
              </>
            ) : timeLeft > 0 ? (
              `Resend OTP in ${timeLeft}s`
            ) : (
              <>
                <span className="material-symbols-outlined mr-2 text-sm">send</span>
                Send Verification Code
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Click the button above to receive a 6-digit verification code via email
            </p>
          </div>
        </div>
      ) : (
        // Verify OTP Step
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Verifying...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2 text-sm">verified</span>
                Verify Email
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setError('');
                setSuccess('');
              }}
              className="text-gray-600 hover:text-gray-800 flex items-center"
            >
              <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
              Change Email
            </button>

            <button
              onClick={handleSendOTP}
              disabled={timeLeft > 0 || isSending}
              className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend Code'}
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <div className="flex items-start">
              <span className="material-symbols-outlined text-yellow-600 mr-2 mt-0.5 text-sm">info</span>
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Didn't receive the code?</p>
                <ul className="space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Wait a few minutes for delivery</li>
                  <li>• Make sure your email address is correct</li>
                  <li>• Try resending the code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailVerification;