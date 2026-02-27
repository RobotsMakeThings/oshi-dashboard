
// === KALSHI DAILY TRADING DATA (REALISTIC DEMO) ===
const KalshiDailyTradingData = {
  todaysSession: {
    wins: 5,
    losses: 2,
    winRate: 71, // 5/(5+2) = 71%
    openPositions: 2,
    lastUpdate: new Date().toLocaleString()
  },
  
  updateDashboard() {
    console.log('📊 Updating Kalshi daily trading data...');
    
    // Update wins
    const winsEl = document.getElementById('kalshiWins');
    if (winsEl) {
      winsEl.textContent = this.todaysSession.wins.toString();
      winsEl.className = 'value win'; // Green for wins
      console.log(`✅ Updated wins: ${this.todaysSession.wins}`);
    }
    
    // Update losses
    const lossesEl = document.getElementById('kalshiLosses');
    if (lossesEl) {
      lossesEl.textContent = this.todaysSession.losses.toString();
      lossesEl.className = 'value loss'; // Red for losses
      console.log(`✅ Updated losses: ${this.todaysSession.losses}`);
    }
    
    // Update win rate
    const winRateEl = document.getElementById('kalshiWinRate');
    if (winRateEl) {
      winRateEl.textContent = `${this.todaysSession.winRate}%`;
      // Color based on performance
      if (this.todaysSession.winRate >= 70) {
        winRateEl.className = 'value win'; // Green for great performance
      } else if (this.todaysSession.winRate >= 50) {
        winRateEl.className = 'value neutral'; // Neutral for decent performance
      } else {
        winRateEl.className = 'value loss'; // Red for poor performance
      }
      console.log(`✅ Updated win rate: ${this.todaysSession.winRate}%`);
    }
    
    // Update open positions
    const positionsEl = document.getElementById('kalshiPositions');
    if (positionsEl) {
      positionsEl.textContent = this.todaysSession.openPositions.toString();
      positionsEl.className = 'value neutral';
      console.log(`✅ Updated positions: ${this.todaysSession.openPositions}`);
    }
    
    console.log('📊 Kalshi daily trading data updated successfully');
  },
  
  // Simulate realistic trading progression throughout the day
  simulateProgress() {
    const hour = new Date().getHours();
    
    // Market hours progression (9 AM - 4 PM EST)
    if (hour >= 9 && hour <= 16) {
      // Active trading hours - progressive stats
      const progress = (hour - 9) / 7; // 0 to 1 throughout day
      
      this.todaysSession.wins = Math.floor(2 + (progress * 4)); // 2-6 wins
      this.todaysSession.losses = Math.floor(1 + (progress * 2)); // 1-3 losses
      this.todaysSession.openPositions = Math.floor(1 + Math.random() * 2); // 1-2 positions
      
      // Calculate win rate
      const totalTrades = this.todaysSession.wins + this.todaysSession.losses;
      this.todaysSession.winRate = Math.round((this.todaysSession.wins / totalTrades) * 100);
    } else {
      // After hours - final stats
      this.todaysSession.wins = 5;
      this.todaysSession.losses = 2;
      this.todaysSession.winRate = 71;
      this.todaysSession.openPositions = 1; // Fewer positions after hours
    }
  }
};

// Initialize and update
console.log('📊 Initializing Kalshi daily trading data...');
KalshiDailyTradingData.simulateProgress();
KalshiDailyTradingData.updateDashboard();

// Update every 30 seconds for realistic progression
setInterval(() => {
  KalshiDailyTradingData.simulateProgress();
  KalshiDailyTradingData.updateDashboard();
}, 30000);

// Expose globally for debugging
window.KalshiDailyTradingData = KalshiDailyTradingData;

