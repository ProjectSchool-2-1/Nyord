// Browser notification service
class BrowserNotificationService {
  constructor() {
    this.permission = 'default';
    this.init();
  }

  async init() {
    // Request notification permission if available
    if ('Notification' in window) {
      this.permission = await this.requestPermission();
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission;
  }

  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'nyord-notification',
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto close after 5 seconds if not requiring interaction
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Show transaction notification
  showTransactionNotification(transaction) {
    const isCredit = transaction.type === 'credit';
    const title = isCredit ? 'Money Received' : 'Money Sent';
    const amount = `$${Math.abs(transaction.amount).toLocaleString()}`;
    const fromTo = isCredit ? `from ${transaction.src_user_name}` : `to ${transaction.dest_user_name}`;
    
    this.showNotification(title, {
      body: `${amount} ${fromTo}`,
      icon: isCredit ? '/icons/money-received.png' : '/icons/money-sent.png',
      tag: `transaction-${transaction.id}`,
      data: {
        type: 'transaction',
        transactionId: transaction.id,
        amount: transaction.amount,
        isCredit
      }
    });
  }

  // Show account notification
  showAccountNotification(message, type = 'info') {
    const icons = {
      success: '/icons/success.png',
      warning: '/icons/warning.png',
      error: '/icons/error.png',
      info: '/icons/info.png'
    };

    this.showNotification('Nyord Banking', {
      body: message,
      icon: icons[type] || icons.info,
      tag: `account-${type}`,
      data: {
        type: 'account',
        messageType: type
      }
    });
  }

  // Show loan notification
  showLoanNotification(message, isApproved = false) {
    this.showNotification(isApproved ? 'Loan Approved' : 'Loan Update', {
      body: message,
      icon: isApproved ? '/icons/loan-approved.png' : '/icons/loan-update.png',
      tag: 'loan-notification',
      requireInteraction: isApproved, // Important notifications require interaction
      data: {
        type: 'loan',
        isApproved
      }
    });
  }

  // Show KYC notification
  showKYCNotification(message, isApproved = false) {
    this.showNotification(isApproved ? 'KYC Approved' : 'KYC Update', {
      body: message,
      icon: isApproved ? '/icons/kyc-approved.png' : '/icons/kyc-update.png',
      tag: 'kyc-notification',
      requireInteraction: isApproved,
      data: {
        type: 'kyc',
        isApproved
      }
    });
  }

  // Check if notifications are supported and enabled
  isSupported() {
    return 'Notification' in window;
  }

  isEnabled() {
    return this.permission === 'granted';
  }

  // Get current permission status
  getPermissionStatus() {
    return this.permission;
  }
}

// Create singleton instance
const notificationService = new BrowserNotificationService();

export default notificationService;