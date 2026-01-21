import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import Toast from '../components/Toast';
import Footer from '../components/Footer';
import '../styles/withdraw.css';

export default function AdminTieredCommission() {
  const [sendTiers, setSendTiers] = useState([]);
  const [withdrawalTiers, setWithdrawalTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const { data } = await adminAPI.getTieredCommission();
        // Normalize tiers to arrays (API may return object or JSON string)
        const normalize = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : Object.values(parsed || {}); } catch (e) { return [] }
          }
          if (typeof val === 'object') return Object.values(val || {});
          return [];
        };

        setSendTiers(normalize(data.tiers));
        setWithdrawalTiers(normalize(data.withdrawalTiers));
      } catch (err) {
        console.error('Failed to load tiered commission', err);
        setMessage('Failed to load tiered commission settings');
      }
    };
    fetchTiers();
  }, []);

  const handleTierChange = (index, field, value, tierType = 'send') => {
    const tiers = tierType === 'send' ? sendTiers : withdrawalTiers;
    const setTiers = tierType === 'send' ? setSendTiers : setWithdrawalTiers;
    
    const newTiers = [...tiers];
    newTiers[index] = {
      ...newTiers[index],
      [field]: (field === 'minAmount' || field === 'maxAmount' || field === 'agentPercent' || field === 'companyPercent') 
        ? parseFloat(value) || 0 
        : parseFloat(value) || 0
    };
    setTiers(newTiers);
  };

  const addTier = (tierType = 'send') => {
    if (tierType === 'send') {
      setSendTiers([...sendTiers, { minAmount: 0, maxAmount: 0, companyPercent: 0 }]);
    } else {
      setWithdrawalTiers([...withdrawalTiers, { minAmount: 0, maxAmount: 0, agentPercent: 0, companyPercent: 0 }]);
    }
  };

  const removeTier = (index, tierType = 'send') => {
    if (tierType === 'send') {
      setSendTiers(sendTiers.filter((_, i) => i !== index));
    } else {
      setWithdrawalTiers(withdrawalTiers.filter((_, i) => i !== index));
    }
  };

  const handleSaveSendMoney = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate send tiers
      for (const tier of sendTiers) {
        if (isNaN(tier.minAmount) || tier.minAmount < 0) {
          setMessage('All send tier minimum amounts must be valid numbers >= 0');
          setLoading(false);
          return;
        }
        if (isNaN(tier.maxAmount) || tier.maxAmount < tier.minAmount) {
          setMessage('All send tier maximum amounts must be valid numbers >= minimum amount');
          setLoading(false);
          return;
        }
        if (isNaN(tier.companyPercent) || tier.companyPercent < 0 || tier.companyPercent > 100) {
          setMessage('All send tier company commission percentages must be between 0 and 100');
          setLoading(false);
          return;
        }
      }

      const { data } = await adminAPI.setSendMoneyTiers({ tiers: sendTiers });
      setMessage('Send Money Commission Tiers saved successfully!');
      setToastMessage('Send Money Commission Tiers updated successfully');
      setToastType('success');
      
      // Update local state with response
      const normalize = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : Object.values(parsed || {}); } catch (e) { return [] }
        }
        if (typeof val === 'object') return Object.values(val || {});
        return [];
      };
      setSendTiers(normalize(data.tiers));
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to save Send Money Commission Tiers');
      setToastMessage('Failed to save Send Money Commission Tiers');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWithdrawal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate withdrawal tiers
      for (const tier of withdrawalTiers) {
        if (isNaN(tier.minAmount) || tier.minAmount < 0) {
          setMessage('All withdrawal tier minimum amounts must be valid numbers >= 0');
          setLoading(false);
          return;
        }
        if (isNaN(tier.maxAmount) || tier.maxAmount < tier.minAmount) {
          setMessage('All withdrawal tier maximum amounts must be valid numbers >= minimum amount');
          setLoading(false);
          return;
        }
        if (isNaN(tier.agentPercent) || tier.agentPercent < 0 || tier.agentPercent > 100) {
          setMessage('All withdrawal tier agent commission percentages must be between 0 and 100');
          setLoading(false);
          return;
        }
        if (isNaN(tier.companyPercent) || tier.companyPercent < 0 || tier.companyPercent > 100) {
          setMessage('All withdrawal tier company commission percentages must be between 0 and 100');
          setLoading(false);
          return;
        }
      }

      const { data } = await adminAPI.setWithdrawalTiers({ withdrawalTiers });
      setMessage('Withdrawal Commission Tiers saved successfully!');
      setToastMessage('Withdrawal Commission Tiers updated successfully');
      setToastType('success');
      
      // Update local state with response
      const normalize = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : Object.values(parsed || {}); } catch (e) { return [] }
        }
        if (typeof val === 'object') return Object.values(val || {});
        return [];
      };
      setWithdrawalTiers(normalize(data.withdrawalTiers));
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to save Withdrawal Commission Tiers');
      setToastMessage('Failed to save Withdrawal Commission Tiers');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="page-container">
      <div className="page-header">
        <h1>💰 Tiered Commission Settings</h1>
        <p>Configure commission percentages based on transaction amount ranges (from minimum to maximum SSP)</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Send Money Commission Tiers</h3>
          <p className="text-muted">Set commission percentages for different transaction amount ranges (from X to Y SSP)</p>
        </div>
        <div className="card-body">
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table className="table" style={{ minWidth: '500px' }}>
                <thead>
                  <tr>
                    <th>Minimum Amount (SSP)</th>
                    <th>Maximum Amount (SSP)</th>
                    <th>Company Commission (%)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(sendTiers || []).map((tier, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={tier?.minAmount || 0}
                          onChange={(e) => handleTierChange(index, 'minAmount', e.target.value, 'send')}
                          style={{ width: '100%', padding: '8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={tier?.minAmount || 0}
                          step="1"
                          value={tier?.maxAmount || 0}
                          onChange={(e) => handleTierChange(index, 'maxAmount', e.target.value, 'send')}
                          style={{ width: '100%', padding: '8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={tier.companyPercent || 0}
                          onChange={(e) => handleTierChange(index, 'companyPercent', e.target.value, 'send')}
                          style={{ width: '100%', padding: '8px' }}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-delete"
                          onClick={() => removeTier(index, 'send')}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => addTier('send')}
                style={{ padding: '8px 16px' }}
              >
                + Add Send Money Tier
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveSendMoney}
                disabled={loading || sendTiers.length === 0}
                style={{ padding: '10px 20px', flex: 1 }}
              >
                {loading ? 'Saving...' : '💰 Save Send Money Tiers'}
              </button>
            </div>

            <div className="card" style={{ marginTop: '30px', marginBottom: '30px' }}>
              <div className="card-header">
                <h3>Withdrawal Commission Tiers</h3>
                <p className="text-muted">Set commission percentages for withdrawal transaction amount ranges (from X to Y SSP)</p>
              </div>
              <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table className="table" style={{ minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th>Minimum Amount (SSP)</th>
                      <th>Maximum Amount (SSP)</th>
                      <th>Agent Commission (%)</th>
                      <th>Company Commission (%)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(withdrawalTiers || []).map((tier, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={tier?.minAmount || 0}
                            onChange={(e) => handleTierChange(index, 'minAmount', e.target.value, 'withdrawal')}
                            style={{ width: '100%', padding: '8px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={tier?.minAmount || 0}
                            step="1"
                            value={tier?.maxAmount || 0}
                            onChange={(e) => handleTierChange(index, 'maxAmount', e.target.value, 'withdrawal')}
                            style={{ width: '100%', padding: '8px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={tier.agentPercent || 0}
                            onChange={(e) => handleTierChange(index, 'agentPercent', e.target.value, 'withdrawal')}
                            style={{ width: '100%', padding: '8px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={tier.companyPercent || 0}
                            onChange={(e) => handleTierChange(index, 'companyPercent', e.target.value, 'withdrawal')}
                            style={{ width: '100%', padding: '8px' }}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-delete"
                            onClick={() => removeTier(index, 'withdrawal')}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addTier('withdrawal')}
                  style={{ padding: '8px 16px' }}
                >
                  + Add Withdrawal Tier
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveWithdrawal}
                  disabled={loading || withdrawalTiers.length === 0}
                  style={{ padding: '10px 20px', flex: 1 }}
                >
                  {loading ? 'Saving...' : '💸 Save Withdrawal Tiers'}
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>📋 How It Works</h3>
        </div>
        <div className="card-body">
          <p>
            When a user sends money or makes a withdrawal, the system calculates the commission based on the transaction amount and the tiers you define.
            The system finds the tier where the transaction amount falls within the <strong>minimum to maximum range</strong>.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong>Example:</strong> If you set:
          </p>
          <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>0-99 SSP: 0% commission</li>
            <li>100-499 SSP: 1% commission</li>
            <li>500-999 SSP: 2% commission</li>
            <li>1000+ SSP: 3% commission</li>
          </ul>
          <p style={{ marginTop: '10px' }}>
            A 150 SSP transfer would use the 1% tier (falls in 100-499 range).<br />
            A 600 SSP transfer would use the 2% tier (falls in 500-999 range).<br />
            A 50 SSP transfer would use the 0% tier (falls in 0-99 range).
          </p>
        </div>
      </div>
    </div>
    <Footer />
    <Toast 
      message={toastMessage} 
      type={toastType} 
      onClose={() => setToastMessage('')} 
    />
    </>
  );
}
