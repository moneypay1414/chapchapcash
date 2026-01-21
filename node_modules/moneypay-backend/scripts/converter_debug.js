// Debug converter logic to check "You Receive" calculation

const BASE_CURRENCY = 'SSP';

function getEffectiveRate(cur, side) {
  if (!cur) return null;
  const pt = cur.priceType || 'fixed';
  const code = (cur.code || '').toUpperCase();
  
  if (pt === 'fixed') {
    const val = side === 'buying' ? cur.buyingPrice : cur.sellingPrice;
    if (val !== undefined && val !== null && val !== '') return Number(val);
    if (code === BASE_CURRENCY.toUpperCase()) return 1;
    return null;
  }
  
  if (pt === 'percentage') {
    const pct = side === 'buying' ? cur.buyingPrice : cur.sellingPrice;
    if (pct !== undefined && pct !== null && pct !== '' && cur.exchangeRate !== undefined && cur.exchangeRate !== null && cur.exchangeRate !== '') {
      return Number(cur.exchangeRate) * (1 + Number(pct) / 100);
    }
    if (pct !== undefined && pct !== null && pct !== '' && code === BASE_CURRENCY.toUpperCase()) {
      return 1 * (1 + Number(pct) / 100);
    }
    return null;
  }
  
  return null;
}

function convertCurrency(amount, fromCur, toCur, priceMode) {
  const fromRate = priceMode === 'buying' ? getEffectiveRate(fromCur, 'selling') : getEffectiveRate(fromCur, 'buying');
  const toRate = priceMode === 'buying' ? getEffectiveRate(toCur, 'buying') : getEffectiveRate(toCur, 'selling');
  
  console.log(`\nConvert: ${amount} ${fromCur.code} -> ${toCur.code} (${priceMode} mode)`);
  console.log(`  fromRate (${fromCur.code}.${priceMode === 'buying' ? 'selling' : 'buying'}):`, fromRate);
  console.log(`  toRate (${toCur.code}.${priceMode === 'buying' ? 'buying' : 'selling'}):`, toRate);
  
  if (fromRate == null || toRate == null) {
    console.log('  Result: MISSING RATES');
    return null;
  }
  
  const result = amount * (fromRate / toRate);
  console.log(`  Calc: ${amount} * (${fromRate} / ${toRate}) = ${result.toFixed(2)}`);
  return result;
}

// Test specific scenario: selling 100 USD -> SSP
const USD = { code: 'USD', buyingPrice: 5800, sellingPrice: 4800, priceType: 'fixed' };
const SSP = { code: 'SSP', buyingPrice: null, sellingPrice: null, priceType: 'fixed' };

console.log('=== Currency Converter Debug (specific test) ===\n');
console.log('Test: Selling 100 USD -> SSP');
console.log('USD sample:', USD);
console.log('SSP sample:', SSP);

convertCurrency(100, USD, SSP, 'selling');

console.log('\nIf this number matches the UI issue (e.g., 5700000), then the rate values are different in your DB.');
console.log('If the number is correct here (580000) but wrong in the UI, open the Converter page and use the Debug panel to copy the debug JSON and share it.');
