// Oshi Dashboard - Real-time Data Fetching

const API_BASE = 'http://138.197.212.247:8080/api';
const REFRESH_INTERVAL = 10000; // 10 seconds

// Format currency
const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    const sign = num >= 0 ? '+' : '';
    return `${sign}$${Math.abs(num).toFixed(2)}`;
};

// Format percentage
const formatPercent = (value) => {
    const num = parseFloat(value) || 0;
    const sign = num >= 0 ? '+' : '';
    return `(${sign}${num.toFixed(1)}%)`;
};

// Get ticker short name
const shortTicker = (ticker) => {
    if (!ticker) return '???';
    // Extract asset and time from ticker like KXBTC15M-26FEB081615-15
    const match = ticker.match(/(BTC|SOL|ETH)/);
    const asset = match ? match[1] : '???';
    const timeMatch = ticker.match(/(\d{4})-/);
    const time = timeMatch ? timeMatch[1] : '';
    return `${asset} ${time}`;
};

// Update status badge
const updateStatus = (data) => {
    const badge = document.getElementById('status-badge');
    const text = badge.querySelector('.status-text');
    
    if (data.running) {
        badge.classList.add('online');
        badge.classList.remove('offline');
        text.textContent = 'ONLINE';
    } else {
        badge.classList.add('offline');
        badge.classList.remove('online');
        text.textContent = 'OFFLINE';
    }
    
    document.getElementById('oshi-market').textContent = data.market || 'Kalshi';
    document.getElementById('oshi-session').textContent = data.session_name || '-';
};

// Update PnL cards
const updatePnL = (data) => {
    const session = data.session || {};
    const wallet = data.wallet || {};
    
    // Session PnL
    const sessionPnlEl = document.getElementById('session-pnl');
    sessionPnlEl.textContent = formatCurrency(session.pnl);
    sessionPnlEl.className = `pnl-value ${session.pnl >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('session-pct').textContent = formatPercent(session.pct);
    document.getElementById('session-wins').textContent = `${session.wins || 0}W`;
    document.getElementById('session-losses').textContent = `${session.losses || 0}L`;
    document.getElementById('session-wr').textContent = `(${session.win_rate || 0}%)`;
    
    // Wallet PnL
    const walletPnlEl = document.getElementById('wallet-pnl');
    walletPnlEl.textContent = formatCurrency(wallet.pnl);
    walletPnlEl.className = `pnl-value ${wallet.pnl >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('wallet-pct').textContent = formatPercent(wallet.pct);
    document.getElementById('wallet-balance').textContent = `$${(wallet.balance || 0).toFixed(2)}`;
};

// Update trades list
const updateTrades = (data) => {
    const container = document.getElementById('trades-list');
    const trades = data.recent || [];
    
    if (trades.length === 0) {
        container.innerHTML = '<div class="empty">No trades yet</div>';
        return;
    }
    
    container.innerHTML = trades.slice(0, 15).map(trade => {
        const side = (trade.side || 'yes').toLowerCase();
        const won = trade.won;
        const pnl = trade.pnl || 0;
        const pnlPct = trade.pnl_pct || 0;
        
        return `
            <div class="trade-item">
                <div class="trade-info">
                    <span class="trade-side ${side}">${side.toUpperCase()}</span>
                    <span class="trade-ticker">${shortTicker(trade.ticker)}</span>
                </div>
                <div class="trade-result">
                    <div class="trade-pnl ${won ? 'win' : won === false ? 'loss' : ''}">${won === null ? 'OPEN' : formatCurrency(pnl)}</div>
                    <div class="trade-pct">${won !== null ? formatPercent(pnlPct) : '@' + trade.price + '¢'}</div>
                </div>
            </div>
        `;
    }).join('');
};

// Update leaderboard
const updateLeaderboard = (data) => {
    const renderBoard = (containerId, trades, isTop) => {
        const container = document.getElementById(containerId);
        
        if (!trades || trades.length === 0) {
            container.innerHTML = '<div class="empty">No trades yet</div>';
            return;
        }
        
        container.innerHTML = trades.map((trade, idx) => {
            const pnl = trade.pnl || 0;
            const rank = isTop ? idx + 1 : trades.length - idx;
            
            return `
                <div class="board-item">
                    <span class="rank">#${idx + 1}</span>
                    <span class="ticker">${shortTicker(trade.ticker)}</span>
                    <span class="pnl ${pnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(pnl)}</span>
                </div>
            `;
        }).join('');
    };
    
    renderBoard('session-top', data.session_top, true);
    renderBoard('session-bottom', data.session_bottom, false);
    renderBoard('alltime-top', data.all_time_top, true);
    renderBoard('alltime-bottom', data.all_time_bottom, false);
};

// Update brain section
const updateBrain = (data) => {
    const renderList = (containerId, items, emptyText) => {
        const container = document.getElementById(containerId);
        
        if (!items || items.length === 0) {
            container.innerHTML = `<li class="empty">${emptyText}</li>`;
            return;
        }
        
        container.innerHTML = items.map(item => {
            const text = typeof item === 'string' ? item : (item.lesson || item.change || item.text || JSON.stringify(item));
            return `<li>${text}</li>`;
        }).join('');
    };
    
    renderList('brain-lessons', data.lessons, 'Learning in progress...');
    renderList('brain-auto', data.auto_implementations, 'No auto-tweaks yet');
    renderList('brain-manual', data.manual_implementations, 'No manual changes');
};

// Main fetch function
const fetchData = async () => {
    try {
        const response = await fetch(`${API_BASE}/all`);
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        
        updateStatus(data.status);
        updatePnL(data.pnl);
        updateTrades(data.trades);
        updateLeaderboard(data.leaderboard);
        updateBrain(data.brain);
        
        // Update timestamp
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
        
    } catch (error) {
        console.error('Fetch error:', error);
        const badge = document.getElementById('status-badge');
        badge.classList.remove('online');
        badge.classList.add('offline');
        badge.querySelector('.status-text').textContent = 'API ERROR';
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setInterval(fetchData, REFRESH_INTERVAL);
});

// Add some visual flair - random glitch effect
setInterval(() => {
    if (Math.random() < 0.1) {
        document.body.style.filter = 'hue-rotate(180deg)';
        setTimeout(() => {
            document.body.style.filter = 'none';
        }, 50);
    }
}, 5000);
