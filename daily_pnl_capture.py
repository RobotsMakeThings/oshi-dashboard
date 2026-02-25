#!/usr/bin/env python3
"""
Daily PnL Capture Script for Kalshi
Runs at 11:59 PM EST to capture day's ending balance and save to daily_pnl.json
"""

import json
import os
from datetime import datetime, timedelta
import requests
import sys

# Configuration
API_BASE = "http://209.38.37.63:5000"
DATA_FILE = "/home/fxnction/.openclaw/workspace-oshi-overseer/oshi-dashboard/daily_pnl.json"

def get_est_date():
    """Get current date in EST timezone"""
    from datetime import timezone
    utc_now = datetime.now(timezone.utc)
    # EST is UTC-5
    est_now = utc_now - timedelta(hours=5)
    return est_now.strftime("%Y-%m-%d")

def get_current_balance():
    """Fetch current balance from Kalshi API"""
    try:
        res = requests.get(f"{API_BASE}/api/balance", timeout=10)
        if res.ok:
            data = res.json()
            return data.get('balance', 0)
    except Exception as e:
        print(f"Error fetching balance: {e}")
    return None

def get_today_stats():
    """Fetch today's trade stats"""
    try:
        res = requests.get(f"{API_BASE}/api/trades", timeout=10)
        if res.ok:
            data = res.json()
            trades = data.get('trades', [])
            
            today = get_est_date()
            today_trades = []
            
            for t in trades:
                # Check if trade is from today (EST)
                exit_time = t.get('exit_time', '')
                if exit_time:
                    trade_date = exit_time.split('T')[0]
                    if trade_date == today:
                        today_trades.append(t)
            
            wins = sum(1 for t in today_trades if t.get('won', False))
            losses = len(today_trades) - wins
            
            return {
                'trades_count': len(today_trades),
                'wins': wins,
                'losses': losses
            }
    except Exception as e:
        print(f"Error fetching trades: {e}")
    
    return {'trades_count': 0, 'wins': 0, 'losses': 0}

def load_daily_pnl_data():
    """Load existing daily PnL data"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading data: {e}")
    
    # Return default structure
    return {
        "version": "1.0",
        "description": "Daily PnL records for Kalshi trading",
        "records": [],
        "current_day": None
    }

def save_daily_pnl_data(data):
    """Save daily PnL data to file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving data: {e}")
        return False

def close_day():
    """Close the current trading day and save record"""
    data = load_daily_pnl_data()
    
    if not data.get('current_day'):
        print("No current day to close")
        return False
    
    current = data['current_day']
    end_balance = get_current_balance()
    
    if end_balance is None:
        print("Failed to get ending balance")
        return False
    
    today_stats = get_today_stats()
    
    start_balance = current.get('start_balance', 0)
    pnl_usd = end_balance - start_balance
    pnl_pct = (pnl_usd / start_balance * 100) if start_balance > 0 else 0
    
    # Create record for today
    today_record = {
        "date": current['date'],
        "start_balance": start_balance,
        "end_balance": end_balance,
        "pnl_usd": round(pnl_usd, 2),
        "pnl_pct": round(pnl_pct, 2),
        "trades_count": today_stats['trades_count'],
        "wins": today_stats['wins'],
        "losses": today_stats['losses'],
        "timestamp_start": f"{current['date']}T05:00:00Z",  # 12 AM EST = 5 AM UTC
        "timestamp_end": datetime.now().isoformat(),
        "notes": ""
    }
    
    # Add to records
    data['records'].append(today_record)
    
    # Start new day
    tomorrow = (datetime.strptime(current['date'], "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
    data['current_day'] = {
        "date": tomorrow,
        "start_balance": end_balance,
        "starting_set": True
    }
    
    if save_daily_pnl_data(data):
        print(f"✅ Day closed: {current['date']}")
        print(f"   P&L: ${pnl_usd:+.2f} ({pnl_pct:+.2f}%)")
        print(f"   Trades: {today_stats['trades_count']} (W:{today_stats['wins']} L:{today_stats['losses']})")
        print(f"   New day started: {tomorrow} with ${end_balance:.2f}")
        return True
    
    return False

def start_new_day(starting_balance=None):
    """Manually start a new trading day"""
    data = load_daily_pnl_data()
    
    today = get_est_date()
    
    if starting_balance is None:
        starting_balance = get_current_balance() or 500.00
    
    data['current_day'] = {
        "date": today,
        "start_balance": starting_balance,
        "starting_set": True
    }
    
    if save_daily_pnl_data(data):
        print(f"✅ New day started: {today} with ${starting_balance:.2f}")
        return True
    
    return False

def show_status():
    """Show current status"""
    data = load_daily_pnl_data()
    
    print("=== Daily PnL Status ===")
    print(f"Total recorded days: {len(data.get('records', []))}")
    
    if data.get('current_day'):
        cd = data['current_day']
        print(f"\nCurrent day: {cd['date']}")
        print(f"Starting balance: ${cd['start_balance']:.2f}")
        
        current_balance = get_current_balance()
        if current_balance:
            pnl = current_balance - cd['start_balance']
            pnl_pct = (pnl / cd['start_balance'] * 100) if cd['start_balance'] > 0 else 0
            print(f"Current balance: ${current_balance:.2f}")
            print(f"Current P&L: ${pnl:+.2f} ({pnl_pct:+.2f}%)")
    
    if data.get('records'):
        print("\n=== Last 5 Days ===")
        for record in data['records'][-5:]:
            emoji = "🟢" if record['pnl_usd'] >= 0 else "🔴"
            print(f"{emoji} {record['date']}: ${record['pnl_usd']:+.2f} ({record['pnl_pct']:+.2f}%) - {record['trades_count']} trades")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 daily_pnl_capture.py [close|start|status]")
        print("  close  - Close current day and start new one")
        print("  start  - Start new day (manual)")
        print("  status - Show current status")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "close":
        close_day()
    elif command == "start":
        balance = float(sys.argv[2]) if len(sys.argv) > 2 else None
        start_new_day(balance)
    elif command == "status":
        show_status()
    else:
        print(f"Unknown command: {command}")
