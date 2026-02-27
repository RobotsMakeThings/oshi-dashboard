
// === KALSHI DAILY STATS MANAGER ===
const KalshiDailyStats = {
  // Today's stats (reset at midnight EST)
  todaysStats: {
    wins: 0,
    losses: 0,
    winRate: 0,
    openPositions: 0,
    lastUpdate: null
  },
  
  // Initialize daily stats
  init() {
    console.log('📊 Initializing Kalshi daily stats...');
    this.checkForNewDay();
    this.updateStatsDisplay();
    this.scheduleUpdates();
  },
  
  // Check if it's a new day (midnight EST reset)
  checkForNewDay() {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
    
    const lastUpdateDate = this.todaysStats.lastUpdate;
    if (!lastUpdateDate || lastUpdateDate !== today) {
      console.log(`📅 New trading day detected: ${today}`);
      this.resetDailyStats();
      this.todaysStats.lastUpdate = today;
    }
  },
  
  // Reset stats for new day
  resetDailyStats() {
    console.log('🔄 Resetting daily Kalshi stats...');
    this.todaysStats = {
      wins: 0,
      losses: 0, 
      winRate: 0,
      openPositions: 0,
      lastUpdate: new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' })
    };
  },
  
  // Update stats from API or trading data
  async updateStatsFromAPI() {
    try {
      console.log('📡 Fetching today\'s Kalshi trading data...');
      
      // Try to fetch from our API
      const response = await fetch('http://209.38.37.63:5000/api/status?t=' + Date.now());
      if (response.ok) {
        const data = await response.json();
        
        // Extract today's trading data if available
        if (data.daily_stats) {
          this.todaysStats.wins = data.daily_stats.wins || 0;
          this.todaysStats.losses = data.daily_stats.losses || 0;
          this.todaysStats.openPositions = data.daily_stats.open_positions || 0;
          
          // Calculate win rate
          const totalTrades = this.todaysStats.wins + this.todaysStats.losses;
          this.todaysStats.winRate = totalTrades > 0 ? 
            Math.round((this.todaysStats.wins / totalTrades) * 100) : 0;
          
          console.log('✅ Updated stats from API:', this.todaysStats);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch API data, using current stats');
    }
  },
  
  // Update the dashboard display
  updateStatsDisplay() {
    console.log('📊 Updating Kalshi dashboard display...');
    
    // Update wins
    const winsEl = document.getElementById('kalshiWins');
    if (winsEl) {
      winsEl.textContent = this.todaysStats.wins.toString();
      winsEl.className = this.todaysStats.wins > 0 ? 'value win' : 'value neutral';
    }
    
    // Update losses
    const lossesEl = document.getElementById('kalshiLosses');  
    if (lossesEl) {
      lossesEl.textContent = this.todaysStats.losses.toString();
      lossesEl.className = this.todaysStats.losses > 0 ? 'value loss' : 'value neutral';
    }
    
    // Update win rate
    const winRateEl = document.getElementById('kalshiWinRate');
    if (winRateEl) {
      winRateEl.textContent = `${this.todaysStats.winRate}%`;
      winRateEl.className = this.todaysStats.winRate >= 60 ? 'value win' : 
                           this.todaysStats.winRate >= 40 ? 'value neutral' : 'value loss';
    }
    
    // Update open positions
    const positionsEl = document.getElementById('kalshiPositions');
    if (positionsEl) {
      positionsEl.textContent = this.todaysStats.openPositions.toString();
    }
    
    console.log('✅ Dashboard display updated');
  },
  
  // Schedule regular updates
  scheduleUpdates() {
    console.log('⏰ Scheduling Kalshi stat updates...');
    
    // Update every 30 seconds
    setInterval(() => {
      this.updateStatsFromAPI().then(() => {
        this.updateStatsDisplay();
      });
    }, 30000);
    
    // Check for new day every minute
    setInterval(() => {
      this.checkForNewDay();
    }, 60000);
    
    // Daily reset at midnight EST
    const scheduleNextReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Midnight local time
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        console.log('🌅 Midnight reset triggered');
        this.resetDailyStats();
        this.updateStatsDisplay();
        scheduleNextReset(); // Schedule next day's reset
      }, msUntilMidnight);
      
      console.log(`⏰ Next reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
    };
    
    scheduleNextReset();
  }
};

// Initialize Kalshi daily stats on page load
console.log('📊 Starting Kalshi Daily Stats Manager...');
KalshiDailyStats.init();

// Also expose globally for debugging
window.KalshiDailyStats = KalshiDailyStats;

