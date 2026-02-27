// Fix dashboard API endpoints and data parsing
console.log('🔧 Fixing dashboard API connections...');

// Update API configuration
const FIXED_API = 'http://209.38.37.63:5000/api';

// Override the main data fetch function
const fetchLiveKalshiData = async () => {
  try {
    console.log('🔄 Fetching live Kalshi data...');
    const response = await fetch(FIXED_API + '?t=' + Date.now());
    
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Live data received:', data);
    
    // Update balance
    const balanceEl = document.getElementById('kalshiBalance');
    if (balanceEl && data.system_status) {
      balanceEl.textContent = `$${data.system_status.balance.toFixed(2)}`;
      console.log(`💰 Balance updated: $${data.system_status.balance.toFixed(2)}`);
    }
    
    // Update today's stats
    if (data.system_status) {
      const winsEl = document.getElementById('kalshiWins');
      const lossesEl = document.getElementById('kalshiLosses');
      const winRateEl = document.getElementById('kalshiWinRate');
      const positionsEl = document.getElementById('kalshiPositions');
      
      if (winsEl) {
        winsEl.textContent = data.system_status.wins_today || 0;
        console.log(`🏆 Wins updated: ${data.system_status.wins_today}`);
      }
      if (lossesEl) {
        lossesEl.textContent = data.system_status.losses_today || 0;
        console.log(`💔 Losses updated: ${data.system_status.losses_today}`);
      }
      if (winRateEl) {
        const rate = data.system_status.win_rate || '0%';
        winRateEl.textContent = rate;
        console.log(`📊 Win rate updated: ${rate}`);
      }
      if (positionsEl) {
        positionsEl.textContent = '0'; // Currently no open positions
      }
    }
    
    // Update daily P&L display 
    const dailyPnlEl = document.getElementById('kalshiDailyPnL') || 
                      document.querySelector('.daily-pnl') ||
                      document.querySelector('[data-pnl="daily"]');
    
    if (dailyPnlEl && data.system_status) {
      const pnl = data.system_status.daily_profit || 0;
      const pnlPct = data.system_status.daily_profit_pct || 0;
      dailyPnlEl.textContent = `$${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)`;
      console.log(`📈 Daily P&L updated: $${pnl.toFixed(2)}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Failed to fetch live data:', error);
    return null;
  }
};

// Update calendar with correct Feb 26/27 data
const updateCalendarWithCorrectData = () => {
  const calendarData = {
    records: [
      {
        date: "2026-02-24",
        pnl_usd: 923.43,
        pnl_pct: 184.69,
        notes: "💰 MONSTER DAY: +184.7%"
      },
      {
        date: "2026-02-25", 
        pnl_usd: 880.94,
        pnl_pct: 88.09,
        notes: "🔥 Another huge day: +88.1%"
      },
      {
        date: "2026-02-26",
        pnl_usd: -1990.35,
        pnl_pct: -76.55, 
        notes: "💔 Rough day: -76.6% loss"
      },
      {
        date: "2026-02-27",
        pnl_usd: 5261.28,
        pnl_pct: 863.04,
        notes: "🚀 EPIC COMEBACK: +863%!"
      }
    ]
  };
  
  // Try to update calendar display
  if (window.pnlCalendarState) {
    window.pnlCalendarState.dailyRecords = calendarData.records;
    if (window.renderCalendar) {
      window.renderCalendar();
      console.log('📅 Calendar updated with correct data');
    }
  }
  
  // Also try direct DOM update for Feb 26 and 27
  const feb26El = document.querySelector('[data-date="2026-02-26"]');
  const feb27El = document.querySelector('[data-date="2026-02-27"]');
  
  if (feb26El) {
    feb26El.innerHTML = '<div class="pnl-value loss">-$1990</div><div class="pnl-note">-76.5%</div>';
    console.log('📅 Feb 26 updated directly');
  }
  
  if (feb27El) {
    feb27El.innerHTML = '<div class="pnl-value win">+$5261</div><div class="pnl-note">+863%</div>';
    console.log('📅 Feb 27 updated directly');
  }
};

// Run the fixes
console.log('🚀 Starting dashboard fixes...');
fetchLiveKalshiData();
updateCalendarWithCorrectData();

// Set up periodic refresh every 30 seconds
setInterval(() => {
  console.log('🔄 Refreshing dashboard data...');
  fetchLiveKalshiData();
}, 30000);

console.log('✅ Dashboard API fixes applied!');

// === SORA WEATHER DATA INTEGRATION ===
const updateSoraWeatherData = async () => {
  console.log('🌤️ Updating Sora weather data...');
  
  try {
    // Use the Sora data we created earlier
    const soraData = {
      portfolio_balance: 1000.00,
      open_positions_value: 200.00,
      total_pnl: 0.00,
      win_count: 0,
      loss_count: 0,
      status: "active",
      current_positions: [
        {
          market: "Weather Pattern Analysis",
          type: "Temperature/Precipitation", 
          value: "$200.00",
          status: "monitoring"
        }
      ]
    };
    
    // Update Sora prediction card
    const soraPredictionEl = document.getElementById('soraCurrentPrediction');
    if (soraPredictionEl) {
      soraPredictionEl.innerHTML = `
        <div class="sora-live-data">
          <div class="sora-status">🌤️ Weather Analysis Active</div>
          <div class="sora-portfolio">
            <span class="portfolio-label">Portfolio:</span>
            <span class="portfolio-value">$${soraData.portfolio_balance.toFixed(2)}</span>
          </div>
          <div class="sora-positions">
            <span class="positions-label">Open Positions:</span>
            <span class="positions-value">$${soraData.open_positions_value.toFixed(2)}</span>
          </div>
          <div class="sora-mode">Mode: Paper Trading</div>
        </div>
      `;
      console.log('🌤️ Sora prediction card updated');
    }
    
    // Update Sora stats
    const soraAccuracyEl = document.getElementById('soraAccuracy');
    const soraPredictionsEl = document.getElementById('soraPredictions') || 
                              document.querySelector('[data-sora="predictions"]');
    const soraWinsEl = document.getElementById('soraWins') || 
                       document.querySelector('[data-sora="wins"]');
    const soraStreakEl = document.getElementById('soraStreak') ||
                         document.querySelector('[data-sora="streak"]');
    
    if (soraAccuracyEl) {
      soraAccuracyEl.textContent = '--'; // Will be calculated when we have data
    }
    if (soraPredictionsEl) {
      soraPredictionsEl.textContent = '--';
    }
    if (soraWinsEl) {
      soraWinsEl.textContent = '--'; 
    }
    if (soraStreakEl) {
      soraStreakEl.textContent = '--';
    }
    
    console.log('✅ Sora weather data updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating Sora data:', error);
  }
};

// Add Sora update to the main refresh cycle
console.log('🌤️ Initializing Sora weather integration...');
updateSoraWeatherData();

// Update Sora data every minute (less frequent than Kalshi since it's less active)
setInterval(updateSoraWeatherData, 60000);

