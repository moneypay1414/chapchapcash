// Simple conversion test harness for MoneyPay converter logic
// Run with: node scripts/convert_test.js

function getEffectiveRate(cur, mode) {
  if (!cur) return 1;
  const base = Number(cur.exchangeRate) || 1;
  const pt = cur.priceType || 'fixed';
  if (pt === 'percentage') {
    if (mode === 'buying' && cur.buyingPrice !== undefined && cur.buyingPrice !== null && cur.buyingPrice !== '') {
      return base * (1 + Number(cur.buyingPrice) / 100);
    }
    if (mode === 'selling' && cur.sellingPrice !== undefined && cur.sellingPrice !== null && cur.sellingPrice !== '') {
      return base * (1 + Number(cur.sellingPrice) / 100);
    }
    return base;
  } else {
    if (mode === 'buying' && cur.buyingPrice !== undefined && cur.buyingPrice !== null && cur.buyingPrice !== '') {
      return Number(cur.buyingPrice);
    }
    if (mode === 'selling' && cur.sellingPrice !== undefined && cur.sellingPrice !== null && cur.sellingPrice !== '') {
      return Number(cur.sellingPrice);
    }
    return base;
  }
}

function convert(amount, fromCur, toCur, mode) {
  const fromRate = getEffectiveRate(fromCur, mode);
  const toRate = getEffectiveRate(toCur, mode);
  if (!isFinite(fromRate) || !isFinite(toRate) || fromRate === 0 || toRate === 0) return null;
  return amount * (fromRate / toRate);
}

const tests = [
  {
    name: 'Fixed buying price example (USD->SSP)',
    from: { code: 'USD', exchangeRate: 4833.3333, priceType: 'fixed', buyingPrice: 5800 },
    to:   { code: 'SSP', exchangeRate: 1, priceType: 'fixed' },
    amount: 1,
    mode: 'buying',
    expect: 5800
  },
  {
    name: 'Percentage buying price example (USD->SSP)',
    from: { code: 'USD', exchangeRate: 4833.3333, priceType: 'percentage', buyingPrice: 20 }, // +20%
    to:   { code: 'SSP', exchangeRate: 1, priceType: 'fixed' },
    amount: 1,
    mode: 'buying',
    expect: 4833.3333 * 1.20
  },
  {
    name: 'Fallback to exchangeRate when buyingPrice missing',
    from: { code: 'USD', exchangeRate: 4833.3333 },
    to:   { code: 'SSP', exchangeRate: 1 },
    amount: 2,
    mode: 'buying',
    expect: 2 * (4833.3333 / 1)
  },
  {
    name: 'Selling fixed rates (SSP->USD)',
    from: { code: 'SSP', exchangeRate: 1, priceType: 'fixed' },
    to:   { code: 'USD', exchangeRate: 4833.3333, priceType: 'fixed', sellingPrice: 4700 },
    amount: 1000,
    mode: 'selling',
    expect: 1000 * (1 / 4700)
  }
];

console.log('Running conversion tests...');
for (const t of tests) {
  const out = convert(t.amount, t.from, t.to, t.mode);
  console.log(`\nTest: ${t.name}`);
  console.log('From:', t.from);
  console.log('To:  ', t.to);
  console.log('Mode:', t.mode);
  console.log('Amount:', t.amount);
  console.log('Result:', out === null ? 'invalid' : out.toFixed(6));
  console.log('Expected (approx):', t.expect ? Number(t.expect).toFixed(6) : 'n/a');
}

console.log('\nDone.');
