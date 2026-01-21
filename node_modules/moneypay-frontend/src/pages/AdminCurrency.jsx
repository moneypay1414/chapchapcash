import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import Toast from '../components/Toast';

export default function AdminCurrency() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [symbol, setSymbol] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [tier, setTier] = useState('');
  const [countries, setCountries] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getCurrencies();
      setCurrencies(data.currencies || []);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load currencies' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (curr) => {
    setEditingId(curr._id);
    setName(curr.name);
    setCode(curr.code);
    setSymbol(curr.symbol || '');
    setExchangeRate(String(curr.exchangeRate || 1));
    setTier(curr.tier || '');
    setCountries((curr.countries || []).join(', '));
  };

  const handleCancel = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setSymbol('');
    setExchangeRate('1');
    setTier('');
    setCountries('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      setToast({ type: 'error', message: 'Name and code are required' });
      return;
    }

    try {
      const payload = {
        name,
        code,
        symbol,
        exchangeRate: Number(exchangeRate) || 1,
        tier,
        countries: countries.split(',').map(c => c.trim()).filter(c => c)
      };

      if (editingId) {
        await adminAPI.updateCurrency(editingId, payload);
        setToast({ type: 'success', message: 'Currency updated' });
      } else {
        await adminAPI.createCurrency(payload);
        setToast({ type: 'success', message: 'Currency created' });
      }

      resetForm();
      setEditingId(null);
      await load();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Operation failed' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this currency?')) return;
    try {
      await adminAPI.deleteCurrency(id);
      setToast({ type: 'success', message: 'Currency deleted' });
      await load();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to delete' });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>Currency Exchange Rate</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        {/* Form */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>{editingId ? 'Edit Currency' : 'Add Currency'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., US Dollar"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., USD"
                maxLength="3"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., $"
                maxLength="5"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Exchange Rate</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="1"
                step="0.01"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Tier</label>
              <input
                type="text"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                placeholder="e.g., Tier 1, Africa, etc."
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Countries (comma-separated)</label>
              <textarea
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder="e.g., USA, Canada, Mexico"
                rows="3"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={handleCancel} style={{ flex: 1 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Currencies</h3>
          {loading ? (
            <div>Loading...</div>
          ) : currencies.length === 0 ? (
            <div style={{ color: '#666' }}>No currencies yet</div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {currencies.map(curr => (
                <div
                  key={curr._id}
                  style={{
                    padding: '12px',
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    background: editingId === curr._id ? '#f0f9ff' : '#fff'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {curr.name} ({curr.code}) {curr.symbol && `${curr.symbol}`}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                    Rate: {curr.exchangeRate} {curr.tier && `| Tier: ${curr.tier}`}
                  </div>
                  {curr.countries?.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                      Countries: {curr.countries.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => handleEdit(curr)}
                      className="btn btn-primary"
                      style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(curr._id)}
                      className="btn btn-delete"
                      style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
