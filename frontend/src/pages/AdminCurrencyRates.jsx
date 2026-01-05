import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import '../styles/layout.css';

export default function AdminCurrencyRates() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [newCountry, setNewCountry] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ code: '', name: '', symbol: '', countries: [] });
  const [exchangeRates, setExchangeRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [showCreateRate, setShowCreateRate] = useState(false);
  const [createRateData, setCreateRateData] = useState({ fromCode: '', toCode: '', buyingPrice: '', sellingPrice: '', priceType: 'fixed' });
  const [editingRateId, setEditingRateId] = useState(null);
  const [editRateData, setEditRateData] = useState({});
  

  useEffect(() => {
    loadCurrencies();
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    setLoadingRates(true);
    try {
      const res = await adminAPI.getExchangeRates();
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : (Array.isArray(data?.exchangeRates) ? data.exchangeRates : []);
      setExchangeRates(list);
    } catch (err) {
      console.error('Failed to load exchange rates', err);
    } finally {
      setLoadingRates(false);
    }
  };

  const loadCurrencies = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCurrencies();
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : (Array.isArray(data?.currencies) ? data.currencies : []);
      setCurrencies(list);
    } catch (err) {
      console.error('Failed to load currencies', err);
    } finally {
      setLoading(false);
    }
  };

  

  const filteredCurrencies = currencies.filter(c =>
    (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (currency) => {
    setEditingId(currency._id);
    setEditData({
      name: currency.name,
      symbol: currency.symbol || '',
      countries: currency.countries || []
    });
    setNewCountry('');
    setShowModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCountry = () => {
    if (newCountry.trim() && !editData.countries.includes(newCountry.trim())) {
      setEditData(prev => ({
        ...prev,
        countries: [...prev.countries, newCountry.trim()]
      }));
      setNewCountry('');
    }
  };

  const removeCountry = (index) => {
    setEditData(prev => ({
      ...prev,
      countries: prev.countries.filter((_, i) => i !== index)
    }));
  };

  const saveEdit = async () => {
    try {
      await adminAPI.updateCurrency(editingId, editData);
      setShowModal(false);
      setEditingId(null);
      loadCurrencies();
    } catch (err) {
      console.error('Failed to update currency', err);
      alert('Error updating currency: ' + (err.response?.data?.error || err.message));
    }
  };

  const cancelEdit = () => {
    setShowModal(false);
    setEditingId(null);
    setEditData({});
  };

  const openCreate = () => {
    setCreateData({ code: '', name: '', symbol: '', countries: [] });
    setShowCreate(true);
  };

  const handleCreateChange = (field, value) => {
    setCreateData(prev => ({ ...prev, [field]: value }));
  };

  const addCreateCountry = (country) => {
    const c = (country || '').trim();
    if (!c) return;
    if (!createData.countries.includes(c)) {
      setCreateData(prev => ({ ...prev, countries: [...prev.countries, c] }));
    }
  };

  const removeCreateCountry = (index) => {
    setCreateData(prev => ({ ...prev, countries: prev.countries.filter((_, i) => i !== index) }));
  };

  const saveCreate = async () => {
    try {
      // Create a new currency (UI no longer captures single-currency buy/sell prices)
      const payload = { code: createData.code, name: createData.name, symbol: createData.symbol, countries: createData.countries };
      await adminAPI.createCurrency(payload);
      setShowCreate(false);
      loadCurrencies();
    } catch (err) {
      console.error('Failed to create currency', err);
      alert('Error creating currency: ' + (err.response?.data?.error || err.message));
    }
  };

  

  const deleteCurrency = async (id) => {
    if (window.confirm('Are you sure you want to delete this currency?')) {
      try {
        await adminAPI.deleteCurrency(id);
        loadCurrencies();
      } catch (err) {
        console.error('Failed to delete currency', err);
        alert('Error deleting currency: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  // Pairwise rate handlers
  const openCreateRate = () => {
    setCreateRateData({ fromCode: '', toCode: '', buyingPrice: '', sellingPrice: '', priceType: 'fixed' });
    setEditingRateId(null);
    setShowCreateRate(true);
  };

  const handleCreateRateChange = (field, value) => {
    setCreateRateData(prev => ({ ...prev, [field]: value }));
  };

  const saveCreateRate = async () => {
    try {
      if (editingRateId) {
        await adminAPI.updateExchangeRate(editingRateId, editRateData);
      } else {
        await adminAPI.createExchangeRate(createRateData);
      }
      setShowCreateRate(false);
      loadExchangeRates();
    } catch (err) {
      console.error('Failed to save exchange rate', err);
      alert('Error saving rate: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteRate = async (id) => {
    if (!window.confirm('Delete this exchange rate?')) return;
    try {
      await adminAPI.deleteExchangeRate(id);
      loadExchangeRates();
    } catch (err) {
      console.error('Failed to delete rate', err);
      alert('Error deleting rate: ' + (err.response?.data?.message || err.message));
    }
  };

  const startEditRate = (rate) => {
    setEditingRateId(rate.id);
    setEditRateData({ fromCode: rate.fromCode || '', toCode: rate.toCode || '', buyingPrice: rate.buyingPrice ?? '', sellingPrice: rate.sellingPrice ?? '', priceType: rate.priceType || 'fixed' });
    setShowCreateRate(true);
  };

  // Base currency used for pairwise rate context
  const baseCurrency = 'USD';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Exchange Rates</h1>
        <p>View and manage all currency exchange rates</p>
      </div>

      {/* Summary Cards */}
      <div className="rates-summary-grid">
        <div className="rate-summary-card">
          <div className="rate-summary-icon">🔗</div>
          <div className="rate-summary-content">
            <div className="rate-summary-label">Pairwise Rates</div>
            <div className="rate-summary-value">{exchangeRates.length}</div>
          </div>
        </div>

        <div className="rate-summary-card">
          <div className="rate-summary-icon">💵</div>
          <div className="rate-summary-content">
            <div className="rate-summary-label">Base Currency</div>
            <div className="rate-summary-value">{baseCurrency}</div>
          </div>
        </div>

        <div className="rate-summary-card">
          <div className="rate-summary-icon">⚡</div>
          <div className="rate-summary-content">
            <div className="rate-summary-label">Last Updated</div>
            <div className="rate-summary-value">Real-time</div>
          </div>
        </div>

        <div className="rate-summary-card">
          <div className="rate-summary-icon">🔄</div>
          <div className="rate-summary-content">
            <div className="rate-summary-label">Status</div>
            <div className="rate-summary-value" style={{color: '#10b981'}}>Active</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card" style={{marginBottom: 24}}>
        <div className="rates-search-container">
          <input
            type="text"
            placeholder="Search by currency code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rates-search-input"
          />
          <span className="rates-search-icon">🔍</span>
        </div>
      </div>

      {/* Currency list removed from this page — pairwise rates are managed below */}

      

      {/* Conversion Reference (removed per request) */}

      <div className="card" style={{marginTop: 24}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <h3 style={{margin: 0}}>Pairwise Exchange Rates</h3>
          <div>
            {loadingRates && <span style={{fontSize: 12, color: '#999', marginRight: 8}}>Loading...</span>}
            <button className="btn btn-primary" onClick={openCreateRate}>＋ Add Pair Rate</button>
          </div>
        </div>

        {loadingRates ? (
          <div style={{padding: 12, color: '#666'}}>Loading pairwise rates...</div>
        ) : exchangeRates.length === 0 ? (
          <div style={{padding: 12, color: '#666'}}>No pairwise rates configured.</div>
        ) : (
          <div className="rates-table-wrapper">
            <table className="rates-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Buying</th>
                  <th>Selling</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exchangeRates.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.fromCode}</strong></td>
                    <td>{r.toCode}</td>
                    <td>{r.buyingPrice ?? '—'}</td>
                    <td>{r.sellingPrice ?? '—'}</td>
                    <td>{r.priceType}</td>
                    <td>
                      <div style={{display: 'flex', gap: 6}}>
                        <button className="action-btn view-btn" onClick={() => startEditRate(r)}>✏️</button>
                        <button className="action-btn delete-btn" onClick={() => deleteRate(r.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card quick-note" style={{marginTop: 24}}>
        <h3 style={{marginBottom: 12}}>Quick Note — Recent Pairwise Rates</h3>
        <div>
          <div style={{marginBottom: 10, color: '#666'}}>Pairwise exchange rates (most recent shown). Manage full list above.</div>
          {loadingRates ? (
            <div className="muted">Loading pairwise rates...</div>
          ) : exchangeRates.length === 0 ? (
            <div className="muted">No pairwise rates configured.</div>
          ) : (
            <div className="pairwise-grid">
              {exchangeRates.slice(0, 8).map(r => (
                <div key={r._id} className="pairwise-tile">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div className="pair-title">{r.fromCode} → {r.toCode}</div>
                    <div style={{fontSize: 12, color: '#6b7280'}}>{r.priceType}</div>
                  </div>
                  <div className="pair-values">
                    <div><span className="price-badge buying-badge" style={{minWidth: '64px', padding: '6px 10px'}}>Buy {r.buyingPrice ?? '—'}</span></div>
                    <div style={{marginTop: 6}}><span className="price-badge selling-badge" style={{minWidth: '64px', padding: '6px 10px'}}>Sell {r.sellingPrice ?? '—'}</span></div>
                  </div>
                  <div className="pair-meta">Updated: {new Date(r.updatedAt || r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Currency</h2>
              <button className="modal-close" onClick={cancelEdit}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Currency Name</label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Symbol</label>
                <input
                  type="text"
                  value={editData.symbol || ''}
                  onChange={(e) => handleEditChange('symbol', e.target.value)}
                  className="form-input"
                  placeholder="e.g., $, ₦, ₵"
                />
              </div>

              {/* Single-currency price inputs removed; pairwise rates are managed separately */}

              <div className="form-group">
                <label>Countries</label>
                <div className="countries-input-group">
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCountry()}
                    className="form-input"
                    placeholder="Add country name"
                  />
                  <button className="btn-add-country" onClick={addCountry}>Add</button>
                </div>

                <div className="countries-tags">
                  {editData.countries && editData.countries.map((country, idx) => (
                    <div key={idx} className="country-tag">
                      {country}
                      <button 
                        className="country-tag-remove"
                        onClick={() => removeCountry(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

        

      {/* Create Modal */}
      {showCreateRate && (
        <div className="modal-overlay" onClick={() => setShowCreateRate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRateId ? '✏️ Edit Pair Rate' : '＋ Add Pair Rate'}</h2>
              <button className="modal-close" onClick={() => setShowCreateRate(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>From Currency Code</label>
                <input
                  type="text"
                  value={editingRateId ? (editRateData.fromCode || '') : (createRateData.fromCode || '')}
                  onChange={(e) => editingRateId ? setEditRateData(prev => ({...prev, fromCode: e.target.value.toUpperCase()})) : handleCreateRateChange('fromCode', e.target.value.toUpperCase())}
                  className="form-input"
                  placeholder="e.g., USD"
                />
              </div>

              <div className="form-group">
                <label>To Currency Code</label>
                <input
                  type="text"
                  value={editingRateId ? (editRateData.toCode || '') : (createRateData.toCode || '')}
                  onChange={(e) => editingRateId ? setEditRateData(prev => ({...prev, toCode: e.target.value.toUpperCase()})) : handleCreateRateChange('toCode', e.target.value.toUpperCase())}
                  className="form-input"
                  placeholder="e.g., SSP"
                />
              </div>

              <div className="form-group">
                <label>Price Type</label>
                <select
                  value={editingRateId ? (editRateData.priceType || 'fixed') : createRateData.priceType}
                  onChange={(e) => editingRateId ? setEditRateData(prev => ({...prev, priceType: e.target.value})) : handleCreateRateChange('priceType', e.target.value)}
                  className="form-input"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Buying Price {editingRateId ? (editRateData.priceType === 'percentage' ? '(%)' : '') : (createRateData.priceType === 'percentage' ? '(%)' : '')}</label>
                  <input
                    type="number"
                    value={editingRateId ? (editRateData.buyingPrice ?? '') : (createRateData.buyingPrice ?? '')}
                    onChange={(e) => editingRateId ? setEditRateData(prev => ({...prev, buyingPrice: e.target.value})) : handleCreateRateChange('buyingPrice', e.target.value)}
                    className="form-input"
                    placeholder={createRateData.priceType === 'percentage' ? 'e.g., 2.5' : 'e.g., 5800 or 0.000172'}
                    step="any"
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price {editingRateId ? (editRateData.priceType === 'percentage' ? '(%)' : '') : (createRateData.priceType === 'percentage' ? '(%)' : '')}</label>
                  <input
                    type="number"
                    value={editingRateId ? (editRateData.sellingPrice ?? '') : (createRateData.sellingPrice ?? '')}
                    onChange={(e) => editingRateId ? setEditRateData(prev => ({...prev, sellingPrice: e.target.value})) : handleCreateRateChange('sellingPrice', e.target.value)}
                    className="form-input"
                    placeholder={createRateData.priceType === 'percentage' ? 'e.g., 1.5' : 'e.g., 5700 or 0.000175'}
                    step="any"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateRate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCreateRate}>{editingRateId ? 'Save Changes' : 'Create Rate'}</button>
            </div>
          </div>
        </div>
      )}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>＋ Add Currency Rate</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Currency Code</label>
                <input
                  type="text"
                  value={createData.code}
                  onChange={(e) => handleCreateChange('code', e.target.value.toUpperCase())}
                  className="form-input"
                  placeholder="e.g., NGN"
                />
              </div>

              <div className="form-group">
                <label>Currency Name</label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={(e) => handleCreateChange('name', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Symbol</label>
                <input
                  type="text"
                  value={createData.symbol}
                  onChange={(e) => handleCreateChange('symbol', e.target.value)}
                  className="form-input"
                  placeholder="e.g., ₦"
                />
              </div>

              <div className="form-group">
                <div style={{color: '#666'}}>Note: Buying/Selling prices are configured per currency pair in the "Pairwise Exchange Rates" section.</div>
              </div>

              <div className="form-group">
                <label>Countries</label>
                <div className="countries-input-group">
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (addCreateCountry(newCountry), setNewCountry(''))}
                    className="form-input"
                    placeholder="Add country name"
                  />
                  <button className="btn-add-country" onClick={() => { addCreateCountry(newCountry); setNewCountry(''); }}>Add</button>
                </div>

                <div className="countries-tags">
                  {createData.countries && createData.countries.map((country, idx) => (
                    <div key={idx} className="country-tag">
                      {country}
                      <button 
                        className="country-tag-remove"
                        onClick={() => removeCreateCountry(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCreate}>Create Currency</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
