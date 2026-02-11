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

// Update version P&L section
const updateVersions = async () => {
    try {
        const res = await fetch(`${API_BASE}/versions`);
        if (!res.ok) return;
        const data = await res.json();
        
        const versions = data.versions || {};
        const overall = data.overall || {};
        const current = data.current_version || 'v5.5';
        
        // Update v5.5 stats in the hero section
        const currentStats = versions[current] || {};
        const v5Pnl = document.getElementById('v5Pnl');
        const v5Trades = document.getElementById('v5Trades');
        const v5Wr = document.getElementById('v5Wr');
        
        if (v5Pnl) {
            v5Pnl.textContent = fmt(currentStats.pnl || 0);
            v5Pnl.style.color = (currentStats.pnl || 0) >= 0 ? 'var(--profit)' : 'var(--loss)';
        }
        if (v5Trades) v5Trades.textContent = currentStats.trades || 0;
        if (v5Wr) v5Wr.textContent = currentStats.win_rate ? `${currentStats.win_rate}%` : '—';
        
        const container = document.getElementById('versionStats');
        if (!container) return;
        
        let html = `
            <div class="version-card overall">
                <div class="version-header">
                    <span class="version-name">📊 Overall</span>
                    <span class="version-badge">ALL TIME</span>
                </div>
                <div class="version-stats">
                    <div class="stat">
                        <span class="stat-value ${overall.pnl >= 0 ? 'positive' : 'negative'}">${fmt(overall.pnl)}</span>
                        <span class="stat-label">P&L</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${overall.win_rate}%</span>
                        <span class="stat-label">Win Rate</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${overall.trades}</span>
                        <span class="stat-label">Trades</span>
                    </div>
                </div>
            </div>
        `;
        
        // Sort versions (newest first)
        const sortedVersions = Object.entries(versions).sort((a, b) => b[0].localeCompare(a[0]));
        
        for (const [vid, v] of sortedVersions) {
            const isCurrent = v.is_current;
            html += `
                <div class="version-card ${isCurrent ? 'current' : ''}">
                    <div class="version-header">
                        <span class="version-name">${v.name}</span>
                        ${isCurrent ? '<span class="version-badge current">ACTIVE</span>' : '<span class="version-badge">ARCHIVED</span>'}
                    </div>
                    <p class="version-desc">${v.description}</p>
                    <div class="version-stats">
                        <div class="stat">
                            <span class="stat-value ${v.pnl >= 0 ? 'positive' : 'negative'}">${fmt(v.pnl)}</span>
                            <span class="stat-label">P&L</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${v.win_rate}%</span>
                            <span class="stat-label">Win Rate</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${v.trades}</span>
                            <span class="stat-label">Trades</span>
                        </div>
                    </div>
                    <div class="version-details">
                        <span class="detail">Best: ${fmt(v.best_trade)}</span>
                        <span class="detail">Worst: ${fmt(v.worst_trade)}</span>
                        <span class="detail">Avg Win: ${fmt(v.avg_win)}</span>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (err) {
        console.error('Version fetch error:', err);
    }
};

// Call version update on load and periodically
document.addEventListener('DOMContentLoaded', () => {
    updateVersions();
    setInterval(updateVersions, 30000); // Update every 30s
});
// Oshi Avatar & Chat Widget
class OshiAvatar {
    constructor() {
        this.container = null;
        this.chatWidget = null;
        this.isOpen = false;
        this.messages = [];
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.createAvatar();
        this.createChatWidget();
        this.loadAvatarState();
        // Update every 30 seconds
        setInterval(() => this.loadAvatarState(), 30000);
    }

    createAvatar() {
        this.container = document.createElement('div');
        this.container.className = 'oshi-avatar-container';
        
        this.avatar = document.createElement('div');
        this.avatar.className = 'oshi-avatar';
        this.avatar.innerHTML = '🤖';
        this.avatar.title = 'Chat with Oshi!';
        
        this.avatar.addEventListener('click', () => this.toggleChat());
        
        this.container.appendChild(this.avatar);
        document.body.appendChild(this.container);
    }

    createChatWidget() {
        this.chatWidget = document.createElement('div');
        this.chatWidget.className = 'oshi-chat-widget hidden';
        
        this.chatWidget.innerHTML = `
            <div class="oshi-chat-header">
                <div class="oshi-chat-avatar-small" id="chatAvatar">🤖</div>
                <div class="oshi-chat-info">
                    <div class="oshi-chat-name">Oshi</div>
                    <div class="oshi-chat-status online">Online - v2.0</div>
                </div>
                <button class="oshi-chat-close" onclick="oshiAvatar.toggleChat()">✕</button>
            </div>
            <div class="oshi-chat-messages" id="chatMessages">
                <div class="oshi-chat-message oshi">
                    <div class="oshi-chat-message-avatar">🤖</div>
                    <div class="oshi-chat-message-bubble">
                        Hey there! I'm Oshi, your friendly trading AI! Ask me about my balance, strategy, or just say hi! 👋
                    </div>
                </div>
            </div>
            <div class="oshi-chat-input-container">
                <input type="text" class="oshi-chat-input" id="chatInput" 
                       placeholder="Ask me anything..." 
                       onkeypress="if(event.key==='Enter')oshiAvatar.sendMessage()">
                <button class="oshi-chat-send" onclick="oshiAvatar.sendMessage()">➤</button>
            </div>
            <div class="oshi-chat-disclaimer">
                For entertainment only. Not trading advice.
            </div>
        `;
        
        this.container.appendChild(this.chatWidget);
    }

    async loadAvatarState() {
        try {
            const res = await fetch(`${this.apiBase}/avatar`);
            if (!res.ok) return;
            
            const state = await res.json();
            this.updateAvatar(state);
        } catch (e) {
            console.error('Avatar load error:', e);
        }
    }

    updateAvatar(state) {
        // Update mood/color
        this.avatar.className = `oshi-avatar mood-${state.mood}`;
        
        // Update emoji based on mood
        const emojis = {
            'excited': '✨',
            'happy': '😊',
            'determined': '💪',
            'focused': '🎯'
        };
        this.avatar.innerHTML = emojis[state.mood] || '🤖';
        
        // Update chat header avatar
        const chatAvatar = document.getElementById('chatAvatar');
        if (chatAvatar) {
            chatAvatar.innerHTML = emojis[state.mood] || '🤖';
            chatAvatar.style.borderColor = state.color;
        }
        
        // Add pulse if significant change
        if (Math.abs(state.pnl) > 10) {
            this.avatar.classList.add('pulse');
        } else {
            this.avatar.classList.remove('pulse');
        }
        
        // Store state
        this.state = state;
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.chatWidget.classList.remove('hidden');
            document.getElementById('chatInput').focus();
        } else {
            this.chatWidget.classList.add('hidden');
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing
        this.showTyping();
        
        // Get response from API
        try {
            const res = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            const data = await res.json();
            this.hideTyping();
            this.addMessage(data.response, 'oshi');
        } catch (e) {
            this.hideTyping();
            this.addMessage('Oops! My brain glitched. Try again? 🧠💥', 'oshi');
        }
    }

    addMessage(text, sender) {
        const container = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `oshi-chat-message ${sender}`;
        
        const emoji = sender === 'oshi' 
            ? (this.state ? {excited:'✨',happy:'😊',determined:'💪',focused:'🎯'}[this.state.mood] : '🤖')
            : '👤';
        
        msgDiv.innerHTML = `
            <div class="oshi-chat-message-avatar">${emoji}</div>
            <div class="oshi-chat-message-bubble">${this.escapeHtml(text)}</div>
        `;
        
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    showTyping() {
        const container = document.getElementById('chatMessages');
        const typing = document.createElement('div');
        typing.className = 'oshi-chat-typing';
        typing.id = 'typingIndicator';
        typing.innerHTML = `
            <div class="oshi-chat-message-avatar">🤖</div>
            <div class="oshi-chat-typing-dot"></div>
            <div class="oshi-chat-typing-dot"></div>
            <div class="oshi-chat-typing-dot"></div>
        `;
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    }

    hideTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    window.oshiAvatar = new OshiAvatar();
});
