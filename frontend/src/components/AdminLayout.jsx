import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { adminAPI } from '../utils/api';
import '../styles/layout.css';

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [rateFrom, setRateFrom] = useState('USD');
  const [rateTo, setRateTo] = useState('NGN');
  const [priceMode, setPriceMode] = useState('buying');

  // Platform base currency code (fallback to 'SSP')
  const BASE_CURRENCY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BASE_CURRENCY) || 'SSP';

  // Helper: compute effective rate for a currency based on priceType
  // Only use buying/selling prices. Treat base currency as 1 when prices are missing.
  const getEffectiveRate = (cur, side) => {
    if (!cur) return null;
    const pt = cur.priceType || 'fixed';
    const code = (cur.code || '').toUpperCase();
    if (pt === 'fixed') {
      const val = side === 'buying' ? cur.buyingPrice : cur.sellingPrice;
      if (val !== undefined && val !== null && val !== '') return Number(val);
      if (code === (BASE_CURRENCY || 'SSP').toUpperCase()) return 1;
      return null;
    }
    if (pt === 'percentage') {
      const pct = side === 'buying' ? cur.buyingPrice : cur.sellingPrice;
      if (pct !== undefined && pct !== null && pct !== '' && cur.exchangeRate !== undefined && cur.exchangeRate !== null && cur.exchangeRate !== '') {
        return Number(cur.exchangeRate) * (1 + Number(pct) / 100);
      }
      if (pct !== undefined && pct !== null && pct !== '' && code === (BASE_CURRENCY || 'SSP').toUpperCase()) {
        return 1 * (1 + Number(pct) / 100);
      }
      return null;
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    const loadPending = async () => {
      try {
        if (!user || user.role !== 'admin') return setPendingCount(0);
        const { data } = await adminAPI.getPendingStateSendsCount();
        if (mounted) setPendingCount(Number(data.count || 0));
      } catch (err) {
        // Fail silently in production; only debug-log during development
        if (import.meta.env && import.meta.env.DEV) {
          console.debug('Failed to load pending state sends count, defaulting to 0', err?.response?.data || err.message || err);
        }
        if (mounted) setPendingCount(0);
      }
    };

    loadPending();
    const refreshHandler = () => { loadPending(); };
    window.addEventListener('mpay:refresh-admin-commission', refreshHandler);
    return () => { mounted = false; window.removeEventListener('mpay:refresh-admin-commission', refreshHandler); };
  }, [user]);

  // Load currencies for exchange rate display
  useEffect(() => {
    let mounted = true;
    const loadCurrencies = async () => {
      try {
        const res = await adminAPI.getCurrencies();
        const data = res?.data || res;
        const list = Array.isArray(data) ? data : (Array.isArray(data?.currencies) ? data.currencies : []);
        if (mounted) {
          setCurrencies(list);
          // Set default to/from if available
          const usd = list.find(c => (c.code || '').toUpperCase() === 'USD');
          const ngn = list.find(c => (c.code || '').toUpperCase() === 'NGN');
          if (usd) setRateFrom('USD');
          if (ngn) setRateTo('NGN');
        }
      } catch (err) {
        console.debug('Failed to load currencies', err);
      }
    };
    loadCurrencies();
    return () => { mounted = false; };
  }, []);

  // Calculate exchange rate
  useEffect(() => {
    if (!currencies.length) return;
    const from = currencies.find(c => (c.code || '').toUpperCase() === rateFrom);
    const to = currencies.find(c => (c.code || '').toUpperCase() === rateTo);
    if (from && to) {
      const fRate = priceMode === 'buying' ? getEffectiveRate(from, 'selling') : getEffectiveRate(from, 'buying');
      const tRate = priceMode === 'buying' ? getEffectiveRate(to, 'buying') : getEffectiveRate(to, 'selling');
      const rate = (fRate != null && tRate != null && isFinite(Number(fRate)) && isFinite(Number(tRate)) && Number(tRate) !== 0) ? (Number(fRate) / Number(tRate)) : null;
      setExchangeRate(rate != null ? (isFinite(rate) ? Number(rate).toFixed(4) : '—') : '—');
    }
  }, [rateFrom, rateTo, currencies, priceMode]);

  

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">💰</span>
          <span className="brand-label">MoneyPay</span>
        </div>

        <nav className="sidebar-menu">
          <Link to="/admin/dashboard" className="sidebar-item">📊 Dashboard</Link>
          <Link to="/admin/users" className="sidebar-item">👥 Users</Link>
          <Link to="/admin/topup" className="sidebar-item">💵 Topup Users</Link>
          <Link to="/admin/push-money" className="sidebar-item">🤝 Push Money</Link>
          <Link to="/admin/withdraw-agent" className="sidebar-item">🏧 Agent Withdrawal</Link>
          <Link to="/admin/transactions" className="sidebar-item">💳 Transactions</Link>
          <Link to="/admin/notifications" className="sidebar-item">🔔 Notifications</Link>
          <Link to="/admin/tiered-commission" className="sidebar-item">💰 Tiered Commission</Link>
          <Link to="/admin/currency-rates" className="sidebar-item">📊 Exchange Rates</Link>
          <Link to="/admin/money-exchange" className="sidebar-item">🔁 Money Exchange</Link>
          <Link to="/admin/state-settings" className="sidebar-item">🗺️ State Settings</Link>
          <Link to="/admin/send-state" className="sidebar-item">✈️ Send By State</Link>
          <Link to="/admin/send-state-pending" className="sidebar-item">
            📥 Send By State Pending
            {pendingCount > 0 && (
              <span style={{marginLeft:8, background:'#ef4444', color:'#fff', borderRadius:12, padding:'2px 8px', fontSize:'0.75rem'}}>{pendingCount}</span>
            )}
          </Link>
          <Link to="/admin/profile" className="sidebar-item">👤 Profile</Link>
          <Link to="/admin/reports" className="sidebar-item">📈 Reports</Link>
          <Link to="/admin/settings" className="sidebar-item">⚙️ Settings</Link>
        </nav>

        {/* Exchange Rate Widget */}
        <div className="exchange-rate-widget">
          <div className="exchange-rate-header">💱 Exchange Rate</div>
          <div className="exchange-rate-body">
            <div className="exchange-rate-mode">
              <select 
                value={priceMode} 
                onChange={(e) => setPriceMode(e.target.value)}
                className="exchange-rate-mode-select"
              >
                <option value="buying">Buying</option>
                <option value="selling">Selling</option>
              </select>
            </div>
            <div className="exchange-rate-inputs">
              <select 
                value={rateFrom} 
                onChange={(e) => setRateFrom(e.target.value)}
                className="exchange-rate-select"
              >
                {currencies.map(c => (
                  <option key={`${c.id}-${c.code}`} value={(c.code || '').toUpperCase()}>
                    {(c.code || '').toUpperCase()}
                  </option>
                ))}
              </select>
              <span className="exchange-rate-arrow">→</span>
              <select 
                value={rateTo} 
                onChange={(e) => setRateTo(e.target.value)}
                className="exchange-rate-select"
              >
                {currencies.map(c => (
                  <option key={`${c.id}-${c.code}`} value={(c.code || '').toUpperCase()}>
                    {(c.code || '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="exchange-rate-display">
              <div className="exchange-rate-value">{exchangeRate ?? '—'}</div>
              <div className="exchange-rate-label">1 {rateFrom} = {rateTo}</div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
            <button onClick={handleLogout} className="btn btn-danger btn-block sidebar-logout">
              <span className="btn-icon">🔒</span>
              <span className="btn-label">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-main">
        <div className="admin-navbar">
          <div className="navbar-brand-admin">
            <Link to="/admin/dashboard" className="brand-link">
              <span className="brand-icon">💰</span>
              <span className="brand-label">MoneyPay</span>
            </Link>
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.name}</span>
            <span className="admin-user-role">{user?.role}</span>
          </div>
        </div>

        <div className="admin-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
          