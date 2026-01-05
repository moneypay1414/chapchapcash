import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import '../styles/layout.css';

export default function AdminMoneyExchange() {
  const [currencies, setCurrencies] = useState([]);
  const [pairRates, setPairRates] = useState([]);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('SSP');
  const [amount, setAmount] = useState(1);
  const [priceMode, setPriceMode] = useState('buying');
  const [result, setResult] = useState('');
  const [usedPair, setUsedPair] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  // Extract unique from/to codes from pairwise rates
  const pairCodes = {
    from: [...new Set(pairRates.map(p => (p.fromCode || '').toUpperCase()).filter(Boolean))],
    to: [...new Set(pairRates.map(p => (p.toCode || '').toUpperCase()).filter(Boolean))]
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const c = await adminAPI.getCurrencies();
        const cd = c?.data || c;
        const cl = Array.isArray(cd) ? cd : (Array.isArray(cd?.currencies) ? cd.currencies : []);
        if (mounted) setCurrencies(cl);
      } catch (e) {
        console.debug('Failed to load currencies', e);
      }
      try {
        const r = await adminAPI.getExchangeRates();
        const rd = r?.data || r;
        const pr = Array.isArray(rd) ? rd : (Array.isArray(rd?.exchangeRates) ? rd.exchangeRates : []);
        if (mounted) setPairRates(pr);
      } catch (e) {
        console.debug('Failed to load pair rates', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const convert = async () => {
    setUsedPair(null);
    setResult('');
    const a = Number(amount || 0);
    if (!from || !to || !a) return;

    try {
      const response = await adminAPI.convertMoneyExchange({
        amount: a,
        fromCurrency: from,
        toCurrency: to,
        priceMode
      });
      const data = response?.data || response;
      if (data && data.convertedAmount !== undefined) {
        setResult(data.convertedAmount);
        setUsedPair(data.usedPair);
      } else {
        setResult('Error: Invalid response from server');
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      setResult('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const saveTransaction = async () => {
    if (!result || !usedPair) {
      setSaveMessage('❌ Please perform a conversion first');
      return;
    }
    try {
      await adminAPI.createTransaction({
        amount: Number(amount),
        fromCurrency: from,
        toCurrency: to,
        convertedAmount: Number(result),
        priceMode,
        pairUsed: { fromCode: usedPair.pair.fromCode, toCode: usedPair.pair.toCode, buyingPrice: usedPair.pair.buyingPrice, sellingPrice: usedPair.pair.sellingPrice },
        type: 'money_exchange',
        description: `Money Exchange: ${amount} ${from} → ${result} ${to} (${priceMode})`
      });
      setSaveMessage('✅ Transaction saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error('Failed to save transaction', e);
      setSaveMessage('❌ Failed to save transaction');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔁 Money Exchange</h1>
        <p>Convert currencies using real pairwise exchange rates. Select currencies, enter amount, and choose buying or selling mode.</p>
      </div>

      {/* Main Exchange Card */}
      <div className="converter-main-grid">
        <div className="converter-card">
          <div className="converter-input-section">
            <div className="converter-input-group">
              <label>From Currency</label>
              <select 
                value={from} 
                onChange={e => setFrom(e.target.value)} 
                className="converter-select-lg"
              >
                {pairCodes.from.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              {usedPair && (
                <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                  <div style={{fontSize:12, color:'#666'}}>From</div>
                  <div style={{fontWeight:700}}>{(usedPair.pair.fromCode || '').toUpperCase()}</div>
                  <div style={{marginLeft:'auto', display:'flex', gap:8}}>
                    <span className="price-badge buying-badge">Buy {usedPair.pair.buyingPrice ? Math.round(usedPair.pair.buyingPrice) : '—'}</span>
                    <span className="price-badge selling-badge">Sell {usedPair.pair.sellingPrice ? Math.round(usedPair.pair.sellingPrice) : '—'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="converter-amount-input">
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="converter-input-amount"
                placeholder="Enter amount"
              />
              <span className="converter-code">{from}</span>
            </div>
          </div>

          <button className="converter-swap-btn" onClick={() => {const t = from; setFrom(to); setTo(t);}} title="Swap currencies">
            <span>⇅</span>
          </button>

          <div className="converter-output-section">
            <div className="converter-input-group">
              <label>To Currency</label>
              <select 
                value={to} 
                onChange={e => setTo(e.target.value)} 
                className="converter-select-lg"
              >
                {pairCodes.to.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              {usedPair && (
                <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                  <div style={{fontSize:12, color:'#666'}}>To</div>
                  <div style={{fontWeight:700}}>{(usedPair.pair.toCode || '').toUpperCase()}</div>
                  <div style={{marginLeft:'auto', display:'flex', gap:8}}>
                    <span className="price-badge buying-badge">Buy {usedPair.pair.buyingPrice ? Math.round(usedPair.pair.buyingPrice) : '—'}</span>
                    <span className="price-badge selling-badge">Sell {usedPair.pair.sellingPrice ? Math.round(usedPair.pair.sellingPrice) : '—'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="converter-result-box">
              <div className="converter-result-value">
                {result || '0.00'}
              </div>
              <span className="converter-code">{to}</span>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="converter-info-grid">
          <div className="info-card">
            <div className="info-icon">💱</div>
            <h3>Exchange Mode</h3>
            <div style={{marginBottom:12}}>
              <select 
                value={priceMode} 
                onChange={e => setPriceMode(e.target.value)}
                className="form-input"
              >
                <option value="buying">Buying</option>
                <option value="selling">Selling</option>
              </select>
            </div>
            <p style={{fontSize:12, color:'#666'}}>
              {priceMode === 'buying' && 'You receive the target currency'}
              {priceMode === 'selling' && 'You send the source currency'}
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">💰</div>
            <h3>You Send</h3>
            <p className="info-value">
              <span className="highlight">{amount || 0}</span> {from}
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">✅</div>
            <h3>You Receive</h3>
            <p className="info-value">
              <span className="highlight">{result || '0.00'}</span> {to}
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">🔗</div>
            <h3>Pair Info</h3>
            {usedPair ? (
              <div style={{fontSize:13}}>
                <div style={{fontWeight:700}}>{usedPair.pair.fromCode} → {usedPair.pair.toCode}</div>
                <div style={{marginTop:6, fontSize:12, color:'#666'}}>
                  {usedPair.inverse ? '(using inverse pair)' : '(direct pair)'}
                </div>
              </div>
            ) : (
              <div style={{color:'#666', fontSize:12}}>No pair data</div>
            )}
          </div>
        </div>
      </div>

      {/* Convert Button */}
      <div style={{marginTop:24, display:'flex', justifyContent:'center', gap:16}}>
        <button 
          className="btn btn-primary" 
          onClick={convert}
          style={{paddingLeft:48, paddingRight:48, fontSize:16, fontWeight:600}}
        >
          🔄 Convert Now
        </button>
        {result && (
          <button 
            className="btn btn-success" 
            onClick={saveTransaction}
            style={{paddingLeft:48, paddingRight:48, fontSize:16, fontWeight:600}}
          >
            💾 Save Transaction
          </button>
        )}
      </div>

      {saveMessage && (
        <div style={{marginTop:12, textAlign:'center', fontSize:14, fontWeight:600, color: saveMessage.includes('✅') ? '#10b981' : '#ef4444'}}>
          {saveMessage}
        </div>
      )}

      {/* Exchange Details */}
      {usedPair && (
        <div className="card" style={{marginTop:24}}>
          <h3 style={{marginBottom:16}}>📊 Exchange Details</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
            <div style={{padding:16, background:'#f6f6f6', borderRadius:8}}>
              <div style={{fontSize:12, color:'#666'}}>Pair Code</div>
              <div style={{fontSize:18, fontWeight:700, marginTop:6}}>
                {usedPair.pair.fromCode} → {usedPair.pair.toCode}
              </div>
            </div>
            <div style={{padding:16, background:'#f6f6f6', borderRadius:8}}>
              <div style={{fontSize:12, color:'#666'}}>Rate Type</div>
              <div style={{fontSize:18, fontWeight:700, marginTop:6}}>
                {usedPair.pair.priceType === 'fixed' ? 'Fixed' : 'Percentage'}
              </div>
            </div>
            <div style={{padding:16, background:'#f6f6f6', borderRadius:8}}>
              <div style={{fontSize:12, color:'#666'}}>Buying Rate</div>
              <div style={{fontSize:18, fontWeight:700, marginTop:6}}>
                {usedPair.pair.buyingPrice ?? '—'}
              </div>
            </div>
            <div style={{padding:16, background:'#f6f6f6', borderRadius:8}}>
              <div style={{fontSize:12, color:'#666'}}>Selling Rate</div>
              <div style={{fontSize:18, fontWeight:700, marginTop:6}}>
                {usedPair.pair.sellingPrice ?? '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}