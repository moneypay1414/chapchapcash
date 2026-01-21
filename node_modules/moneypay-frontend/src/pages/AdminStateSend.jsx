import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import Toast from '../components/Toast';

export default function AdminStateSend() {
  const [states, setStates] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stateId, setStateId] = useState('');
  const [toAdminId, setToAdminId] = useState('');
  const [amount, setAmount] = useState('');
  const [deduct, setDeduct] = useState(true);
  const [commission, setCommission] = useState(0);
  const [receiverAmount, setReceiverAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [currencyId, setCurrencyId] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  const load = async () => {
    try {
      const sres = await adminAPI.getStateSettings();
      setStates(sres.data.states || []);
      const ures = await adminAPI.getAllUsers();
      const adminsOnly = (ures.data || []).filter(u => u.role === 'admin');
      setAdmins(adminsOnly);
      try {
        const cres = await adminAPI.getCurrencies();
        setCurrencies(cres.data.currencies || []);
      } catch (e) {
        console.debug('Currencies load failed', e?.message || e);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const amt = parseFloat(amount) || 0;
    const st = states.find(s => String(s._id) === String(stateId));
    const pct = st ? Number(st.commissionPercent || 0) : 0;
    const comm = Math.round((amt * (pct / 100)) * 100) / 100;
    setCommission(comm);
    if (deduct) {
      // Deduct mode: You send full amount, receiver gets (amount - commission)
      setReceiverAmount(Math.round((amt - comm) * 100) / 100);
    } else {
      // Full mode: Receiver gets full amount, you send (amount - commission)
      setReceiverAmount(amt);
    }
  }, [amount, stateId, deduct, states]);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { toAdminId, amount: Number(amount), stateId, deductCommissionFromAmount: deduct, currencyId };
      const res = await adminAPI.adminSendState(payload);
      setToast({ type: 'success', message: 'Transfer completed successfully!' });
      // Signal dashboard to refresh commission
      window.dispatchEvent(new CustomEvent('mpay:refresh-admin-commission'));
      // If we're in the admin area, reload to ensure admin pages refresh their data
      try {
        if (window.location.pathname.startsWith('/admin')) {
          // small delay so toast is visible before reload
          setTimeout(() => { window.location.reload(); }, 300);
        }
      } catch (e) {
        console.error('Auto-reload failed', e);
      }
      setAmount(''); setToAdminId(''); setStateId(''); setCurrencyId(''); setSelectedCurrency(null);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Send failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="send-by-state-title">Send By State</h2>
      <form onSubmit={handleSend} className="card fade-in send-by-state" style={{display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640}}>
        <label>State (commission source)</label>
        <select value={stateId} onChange={(e) => setStateId(e.target.value)}>
          <option value="">-- Select state --</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.commissionPercent}%)</option>)}
        </select>

        <label>Destination Admin</label>
        <select value={toAdminId} onChange={(e) => setToAdminId(e.target.value)}>
          <option value="">-- Select admin --</option>
          {admins.map(a => <option key={a.id} value={a.id}>{a.name} ({a.phone})</option>)}
        </select>

        <label>Currency</label>
        <select value={currencyId} onChange={(e) => {
          setCurrencyId(e.target.value);
          const cur = currencies.find(c => c.id === e.target.value);
          setSelectedCurrency(cur || null);
        }}>
          <option value="">-- Select currency --</option>
          {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code}) {c.symbol ? ` ${c.symbol}` : ''}</option>)}
        </select>

        <label>Amount</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />

        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <div style={{fontWeight: 600}}>{deduct ? 'Deduct Commission' : 'Give Full Amount'}</div>
            <div className="switch-labels">
              {deduct ? 'You send 100, receiver gets 95, you get 5 commission' : 'You send 95, receiver gets 100 (commission credited to you)'}
            </div>
          </div>
          <div className="toggle-group" role="tablist" aria-label="Commission mode">
            <button
              type="button"
              className={"toggle-option" + (deduct ? ' active' : '')}
              aria-pressed={deduct}
              onClick={() => setDeduct(true)}
            >
              Deduct
            </button>
            <button
              type="button"
              className={"toggle-option" + (!deduct ? ' active' : '')}
              aria-pressed={!deduct}
              onClick={() => setDeduct(false)}
            >
              Full
            </button>
          </div>
        </div>

        <div style={{padding:12, border:'1px solid #eee', borderRadius:6}}>
          {deduct ? (
            <>
              <div>You send: <strong>{selectedCurrency?.symbol || 'SSP'} {amount || '0.00'}</strong></div>
              <div>Commission (credited to your Admin Cash): <strong>{selectedCurrency?.symbol || 'SSP'} {commission.toFixed(2)}</strong></div>
              <div>Receiver gets: <strong>{selectedCurrency?.symbol || 'SSP'} {receiverAmount.toFixed(2)}</strong></div>
            </>
          ) : (
            <>
              <div>Receiver gets: <strong>{selectedCurrency?.symbol || 'SSP'} {receiverAmount.toFixed(2)}</strong></div>
              <div>Commission (credited to you): <strong>{selectedCurrency?.symbol || 'SSP'} {commission.toFixed(2)}</strong></div>
              <div style={{marginTop:8, color:'#555', fontSize:'0.9rem'}}>Commission is credited to your <strong>Admin Commission Cash</strong>.</div>
            </>
          )}
        </div>

        <div style={{display: 'flex', gap: 8}}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </form>
    </div>
  );
}
