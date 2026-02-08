// Oshi Dashboard - Live Data Connection
const API_BASE = '/api';
const REFRESH_INTERVAL = 5000;

// Format helpers
const fmt = (v) => {
    const n = parseFloat(v) || 0;
    return `${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(2)}`;
};
const fmtPct = (v) => `${parseFloat(v) >= 0 ? '+' : ''}${(parseFloat(v) || 0).toFixed(1)}%`;
const shortTicker = (t) => {
    if (!t) return '???';
    const asset = (t.match(/(BTC|SOL|ETH)/) || ['???'])[0];
    const time = (t.match(/(\d{4})-/) || ['', ''])[1];
    return `${asset} ${time}`;
};

// Update status section
const updateStatus = (data) => {
    const label = document.getElementById('statusLabel');
    if (data.running) {
        label.textContent = 'RUNNING';
        label.style.color = 'var(--profit)';
    } else {
        label.textContent = 'OFFLINE';
        label.style.color = 'var(--loss)';
    }
};

// Update stats row
const updateStats = (pnl, trades) => {
    const session = pnl?.session || {};
    const wins = session.wins || 0;
    const losses = session.losses || 0;
    const total = wins + losses;
    
    document.getElementById('winRate').textContent = total > 0 ? `${((wins/total)*100).toFixed(1)}%` : '0%';
    document.getElementById('tradesToday').textContent = total;
    document.getElementById('avgReturn').textContent = fmtPct(session.pct / Math.max(total, 1));
    document.getElementById('activePos').textContent = trades?.active?.length || 0;
    document.getElementById('streak').textContent = session.streak || '-';
};

// Update PnL cards
const updatePnL = (data) => {
    const session = data?.session || {};
    const wallet = data?.wallet || {};
    
    const sPnl = document.getElementById('sessionPnl');
    sPnl.textContent = fmt(session.pnl);
    sPnl.className = `pnl-value ${(session.pnl || 0) >= 0 ? 'positive' : 'negative'}`;
    
    const sPct = document.getElementById('sessionPct');
    sPct.textContent = fmtPct(session.pct);
    sPct.className = `pnl-pct ${(session.pct || 0) >= 0 ? 'positive' : 'negative'}`;
    
    const wPnl = document.getElementById('walletPnl');
    wPnl.textContent = fmt(wallet.pnl);
    wPnl.className = `pnl-value ${(wallet.pnl || 0) >= 0 ? 'positive' : 'negative'}`;
    
    const wPct = document.getElementById('walletPct');
    wPct.textContent = fmtPct(wallet.pct);
    wPct.className = `pnl-pct ${(wallet.pct || 0) >= 0 ? 'positive' : 'negative'}`;
};

// Update recent trades
const updateTrades = (data) => {
    const container = document.getElementById('recentTrades');
    const trades = data?.recent || [];
    
    if (!trades.length) {
        container.innerHTML = '<li class="trade-item">No trades yet</li>';
        return;
    }
    
    container.innerHTML = trades.slice(0, 10).map(t => {
        const side = (t.side || 'yes').toUpperCase();
        const won = t.won;
        const pnl = t.pnl || 0;
        const cls = won === true ? 'win' : won === false ? 'loss' : 'open';
        return `
            <li class="trade-item ${cls}">
                <span class="trade-side ${side.toLowerCase()}">${side}</span>
                <span class="trade-name">${shortTicker(t.ticker)}</span>
                <span class="trade-result">${won === null ? 'OPEN' : (won ? 'WIN' : 'LOSS')}</span>
                <span class="trade-pct">${won !== null ? fmtPct(t.pnl_pct) : '@' + t.price + '¢'}</span>
                <span class="trade-pnl ${pnl >= 0 ? 'positive' : 'negative'}">${won !== null ? fmt(pnl) : '-'}</span>
            </li>
        `;
    }).join('');
};

// Update leaderboards
const updateLeaderboard = (data) => {
    const render = (id, items) => {
        const el = document.getElementById(id);
        if (!items?.length) {
            el.innerHTML = '<li class="leader-item">No data</li>';
            return;
        }
        el.innerHTML = items.slice(0, 5).map((t, i) => {
            const pnl = t.pnl || 0;
            const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            return `
                <li class="leader-item">
                    <span class="rank ${rankCls}">${i + 1}</span>
                    <span class="trade-name">${shortTicker(t.ticker)}</span>
                    <span class="trade-pct">${fmtPct(t.pnl_pct)}</span>
                    <span class="trade-pnl ${pnl >= 0 ? 'positive' : 'negative'}">${fmt(pnl)}</span>
                </li>
            `;
        }).join('');
    };
    
    render('sessionTop', data?.session_top);
    render('sessionWorst', data?.session_bottom);
    render('allTimeTop', data?.all_time_top);
    render('allTimeWorst', data?.all_time_bottom);
};

// Update brain section
const updateBrain = (data) => {
    const render = (id, items, empty) => {
        const el = document.getElementById(id);
        if (!items?.length) {
            el.innerHTML = `<li class="lesson-item">${empty}</li>`;
            return;
        }
        el.innerHTML = items.slice(0, 5).map(item => {
            const text = item.key_lesson || item.lesson || item.change || item.text || JSON.stringify(item);
            const won = item.won;
            const cls = won === true ? 'success' : won === false ? 'warning' : '';
            return `<li class="lesson-item ${cls}">${text}</li>`;
        }).join('');
    };
    
    render('lessons', data?.lessons, 'Learning in progress...');
    render('implementations', data?.auto_implementations, 'No auto-tweaks');
    render('manual', data?.manual_implementations, 'No manual changes');
};

// Main fetch
const fetchData = async () => {
    try {
        const res = await fetch(`${API_BASE}/all`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        
        updateStatus(data.status || {});
        updateStats(data.pnl, data.trades);
        updatePnL(data.pnl || {});
        updateTrades(data.trades || {});
        updateLeaderboard(data.leaderboard || {});
        updateBrain(data.brain || {});
        
        console.log('✅ Oshi data updated', new Date().toLocaleTimeString());
    } catch (err) {
        console.error('❌ Fetch error:', err);
        document.getElementById('statusLabel').textContent = 'API ERROR';
        document.getElementById('statusLabel').style.color = 'var(--loss)';
    }
};

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setInterval(fetchData, REFRESH_INTERVAL);
});
