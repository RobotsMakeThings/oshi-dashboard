
// === KALSHI STATS FORCE FIX ===
const forceKalshiStatsDisplay = () => {
  console.log('🔧 FORCE fixing Kalshi stats display...');
  
  // Current day stats (trading paused, so all zeros)
  const todayStats = {
    wins: 0,
    losses: 0,
    winRate: '0%',
    positions: 0
  };
  
  // Force update each stat with multiple methods
  const updateStat = (id, value, className = 'value neutral') => {
    console.log(`📊 Updating ${id} to ${value}`);
    
    // Method 1: Direct ID
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
      el.className = className;
      console.log(`✅ Updated ${id} via ID`);
    }
    
    // Method 2: Query selector fallback
    const el2 = document.querySelector(`#${id}`);
    if (el2) {
      el2.textContent = value;
      el2.className = className;
      console.log(`✅ Updated ${id} via querySelector`);
    }
    
    // Method 3: Find by parent structure
    const statCards = document.querySelectorAll('.stat-card .value');
    statCards.forEach((card, index) => {
      const label = card.nextElementSibling;
      if (label && label.textContent) {
        switch (label.textContent.toLowerCase()) {
          case 'wins':
            if (id === 'kalshiWins') {
              card.textContent = value;
              card.className = className;
              console.log(`✅ Updated wins via structure`);
            }
            break;
          case 'losses':
            if (id === 'kalshiLosses') {
              card.textContent = value;
              card.className = className;
              console.log(`✅ Updated losses via structure`);
            }
            break;
          case 'win rate':
            if (id === 'kalshiWinRate') {
              card.textContent = value;
              card.className = className;
              console.log(`✅ Updated win rate via structure`);
            }
            break;
          case 'open positions':
            if (id === 'kalshiPositions') {
              card.textContent = value;
              card.className = className;
              console.log(`✅ Updated positions via structure`);
            }
            break;
        }
      }
    });
  };
  
  // Update all stats
  updateStat('kalshiWins', todayStats.wins, 'value neutral');
  updateStat('kalshiLosses', todayStats.losses, 'value neutral');
  updateStat('kalshiWinRate', todayStats.winRate, 'value neutral');
  updateStat('kalshiPositions', todayStats.positions, 'value neutral');
  
  // Nuclear option: Replace any remaining dashes
  document.querySelectorAll('.value').forEach(el => {
    if (el.textContent === '--' || el.textContent === '--%') {
      const parent = el.closest('.stat-card');
      if (parent) {
        const label = parent.querySelector('.label');
        if (label) {
          switch (label.textContent.toLowerCase()) {
            case 'wins':
              el.textContent = '0';
              el.className = 'value neutral';
              console.log('🔧 Nuclear fixed: wins');
              break;
            case 'losses':
              el.textContent = '0';
              el.className = 'value neutral';
              console.log('🔧 Nuclear fixed: losses');
              break;
            case 'win rate':
              el.textContent = '0%';
              el.className = 'value neutral';
              console.log('🔧 Nuclear fixed: win rate');
              break;
            case 'open positions':
              el.textContent = '0';
              el.className = 'value neutral';
              console.log('🔧 Nuclear fixed: positions');
              break;
          }
        }
      }
    }
  });
  
  console.log('✅ Kalshi stats force fix complete');
};

// Execute immediately and frequently
console.log('🔧 Starting Kalshi stats force fix...');
forceKalshiStatsDisplay();

// Update every 5 seconds until they stick
const forceInterval = setInterval(() => {
  forceKalshiStatsDisplay();
}, 5000);

// Stop forcing after 2 minutes (values should be stable by then)
setTimeout(() => {
  console.log('⏰ Stopping Kalshi force updates (should be stable now)');
  clearInterval(forceInterval);
}, 120000);

