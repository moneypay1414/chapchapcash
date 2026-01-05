import React from 'react';
import { generateTransactionDocument } from '../utils/pdf';
import '../styles/print-receipt.css';

export default function PrintReceipt({ transaction, onClose }) {
  if (!transaction) return null;

  const handleNativePrint = () => {
    // Add print-specific class to body for CSS-based printing
    document.body.classList.add('printing-receipt');
    
    // Use browser's native print
    window.print();
    
    // Remove the class after printing
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 1000);
  };
    // Use hidden iframe for printing (works without popup permissions)
    const styles = `
  /* Inline print styles for A4 receipt - match browser display */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { width: 100%; height: 100%; }
  body { font-family: Arial, sans-serif; background: #fff; color: #000; line-height: 1.6; font-size: 12px; }
  .receipt-content { padding: 20px; border: 3px solid #000; margin: 0; background: #fff; }
  .receipt-logo { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #000; }
  .receipt-logo h1 { font-size: 24px; font-weight: bold; color: #000; margin: 5px 0; }
  .receipt-section {
    margin-bottom: 15px;
    page-break-inside: avoid;
    display: block;
    visibility: visible;
  }
  .receipt-section h3 {
    font-size: 13px;
    font-weight: bold;
    color: #000;
    text-transform: uppercase;
    margin: 0 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 2px solid #000;
    display: block;
    visibility: visible;
  }
  .receipt-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #000; line-height: 1.5; }
  .receipt-row .label { font-weight: bold; color: #000; flex: 0 0 40%; min-width: 100px; }
  .receipt-row .value { text-align: right; flex: 1; color: #000; margin-left: 10px; word-break: break-word; }
  .receipt-footer { text-align: center; padding-top: 15px; margin-top: 20px; border-top: 2px solid #000; color: #000; font-size: 11px; font-weight: bold; line-height: 1.5; }
  .receipt-footer p { margin: 5px 0; }
  .receipt-table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 12px 0; 
    border: 2px solid #000; 
    table-layout: fixed;
    display: table;
    visibility: visible;
  }
  .receipt-table th { 
    background: #000; 
    color: #fff; 
    padding: 8px 10px; 
    text-align: left; 
    font-weight: bold; 
    font-size: 12px; 
    border: 1px solid #000; 
    line-height: 1.4; 
    display: table-cell;
  }
  .receipt-table td { 
    padding: 8px 10px; 
    border: 1px solid #000; 
    font-size: 12px; 
    color: #000; 
    font-weight: 500; 
    line-height: 1.4; 
    display: table-cell;
    word-wrap: break-word;
  }
  .receipt-table thead { display: table-header-group; }
  .receipt-table tbody { display: table-row-group; }
  .receipt-table tr { display: table-row; }
  .receipt-table .amount-cell { text-align: right; font-weight: bold; }
  .receipt-table tr:nth-child(even) { background: #f9f9f9; }
  .receipt-table tr.total-row { background: #000; color: #fff; font-weight: bold; }
  .receipt-table tr.total-row td { color: #fff; border-color: #000; background: #000; }
  @page { size: A4; margin: 0.5in; padding: 0; }
  @media print {
    html { margin: 0; padding: 0; }
    body { margin: 0; padding: 0; width: auto; height: auto; }
    .receipt-content { margin: 0; padding: 20px; width: auto; page-break-inside: avoid; }
    .receipt-table { display: table !important; visibility: visible !important; }
    .receipt-table th, .receipt-table td { display: table-cell !important; }
    .receipt-table thead, .receipt-table tbody { display: table-header-group !important; }
    .receipt-table tr { display: table-row !important; }
  }
  `;

    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt - ${transaction.transactionId}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="receipt-content">
          <div class="receipt-logo"><h1>💳 MoneyPay</h1></div>

          <div class="receipt-section">
            <h3>Receipt Details</h3>
            <div class="receipt-row"><span class="label">Transaction ID:</span><span class="value">${transaction.transactionId}</span></div>
            <div class="receipt-row"><span class="label">Date & Time:</span><span class="value">${formatDate(transaction.createdAt)}</span></div>
            <div class="receipt-row"><span class="label">Transaction Type:</span><span class="value">${getTransactionType(transaction.type)}</span></div>
          </div>

          <div class="receipt-section">
            <h3>Parties</h3>
            <div class="receipt-row"><span class="label">From:</span><span class="value">${transaction.sender?.name || transaction.sender?.phone || 'System'}</span></div>
            ${transaction.senderLocation ? `<div class="receipt-row"><span class="label">From Location:</span><span class="value">${transaction.senderLocation.city || 'Unknown'}, ${transaction.senderLocation.country || 'Unknown'}</span></div>` : ''}
            <div class="receipt-row"><span class="label">To:</span><span class="value">${transaction.receiver?.name || transaction.receiver?.phone || 'N/A'}</span></div>
            ${transaction.receiverLocation ? `<div class="receipt-row"><span class="label">To Location:</span><span class="value">${transaction.receiverLocation.city || 'Unknown'}, ${transaction.receiverLocation.country || 'Unknown'}</span></div>` : ''}
          </div>

          <div class="receipt-section">
            <h3>Amount Details</h3>
            <table class="receipt-table">
              <thead>
                <tr><th>Description</th><th>SSP</th></tr>
              </thead>
              <tbody>
                <tr><td>Transaction Amount</td><td class="amount-cell">SSP ${ (parseFloat(transaction.amount) || 0).toFixed(2) }</td></tr>
                ${transaction.agentCommission !== undefined ? `
                  <tr><td>Agent Commission (${transaction.agentCommissionPercent || 0}%)</td><td class="amount-cell">SSP ${ (parseFloat(transaction.agentCommission) || 0).toFixed(2) }</td></tr>
                ` : ''}
                ${transaction.companyCommission !== undefined ? `
                  <tr><td>Company Commission (${transaction.companyCommissionPercent || 0}%)</td><td class="amount-cell">SSP ${ (parseFloat(transaction.companyCommission) || 0).toFixed(2) }</td></tr>
                ` : ''}
                <tr><td><strong>Total Commission Fee</strong></td><td class="amount-cell"><strong>SSP ${ ((parseFloat(transaction.agentCommission)||0)+(parseFloat(transaction.companyCommission)||0)).toFixed(2) }</strong></td></tr>
                <tr class="total-row"><td><strong>TOTAL USER PAYS</strong></td><td class="amount-cell"><strong>SSP ${ ((parseFloat(transaction.amount)||0) + (parseFloat(transaction.agentCommission)||0) + (parseFloat(transaction.companyCommission)||0)).toFixed(2) }</strong></td></tr>
              </tbody>
            </table>
          </div>

          <div class="receipt-section">
            <h3>Status</h3>
            <div class="receipt-row"><span class="label">Status:</span><span class="value status-${transaction.status}">${(transaction.status || '').toUpperCase() || 'UNKNOWN'}</span></div>
            ${transaction.description ? `<div class="receipt-row"><span class="label">Description:</span><span class="value">${transaction.description}</span></div>` : ''}
          </div>

          <div class="receipt-footer"><p>Thank you for using MoneyPay</p><p class="print-instruction">Print this receipt for your records</p></div>
        </div>
      </body>
    </html>`;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    try {
      let printed = false; // guard to prevent double-printing
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        alert('Could not access iframe for printing. Please try again.');
        document.body.removeChild(iframe);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      console.log('Print iframe content written, HTML length:', html.length);

      // Wait for iframe content to fully load
      iframe.onload = () => {
        console.log('Print iframe loaded successfully');
        setTimeout(() => {
          try {
            if (!printed) {
              printed = true;
              console.log('Attempting to print...');
              iframe.contentWindow?.print();
            }
          } catch (err) {
            console.error('Printing failed:', err);
            // Fallback: try direct print
            try {
              window.print();
            } catch (fallbackErr) {
              console.error('Fallback printing also failed:', fallbackErr);
              alert('Printing failed. Please try using Ctrl+P (Cmd+P on Mac) to print this page.');
            }
          }
          // Remove iframe after short delay to allow print dialog to open
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          }, 500);
        }, 500); // Increased timeout
      };

      // Fallback timeout if onload doesn't fire
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          console.log('Print iframe fallback timeout triggered');
          try {
            if (!printed) {
              printed = true;
              console.log('Attempting fallback print...');
              iframe.contentWindow?.print();
            }
          } catch (err) {
            console.error('Printing failed (timeout fallback):', err);
            // Fallback: try direct print
            try {
              window.print();
            } catch (fallbackErr) {
              console.error('Fallback printing also failed:', fallbackErr);
              alert('Printing failed. Please try using Ctrl+P (Cmd+P on Mac) to print this page.');
            }
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 500);
        }
      }, 3000); // Increased fallback timeout
    } catch (err) {
      console.error('Error setting up iframe print:', err);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTransactionType = (type) => {
    const types = {
      transfer: 'Money Transfer',
      withdrawal: 'Withdrawal',
      topup: 'Account Top-up',
      agent_deposit: 'Agent Deposit',
      user_withdraw: 'User Withdrawal',
      agent_cash_out_money: 'Admin Cash Out',
      admin_push: 'Admin Push Money'
    };
    return types[type] || type;
  };

  return (
    <div className="print-receipt-overlay" onClick={onClose}>
      <div className="print-receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="print-receipt-header">
          <h2>📄 Transaction Receipt</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="receipt-content">
          <div className="receipt-logo">
            <h1>💳 MoneyPay</h1>
          </div>

          <div className="receipt-section">
            <h3>Receipt Details</h3>
            <div className="receipt-row">
              <span className="label">Transaction ID:</span>
              <span className="value">{transaction.transactionId}</span>
            </div>
            <div className="receipt-row">
              <span className="label">Date & Time:</span>
              <span className="value">{formatDate(transaction.createdAt)}</span>
            </div>
            <div className="receipt-row">
              <span className="label">Transaction Type:</span>
              <span className="value">{getTransactionType(transaction.type)}</span>
            </div>
          </div>

          <div className="receipt-section">
            <h3>Parties</h3>
            <div className="receipt-row">
              <span className="label">From:</span>
              <span className="value">
                {transaction.sender?.name || transaction.sender?.phone || 'System'}
              </span>
            </div>
            {transaction.senderLocation && (
              <div className="receipt-row">
                <span className="label">From Location:</span>
                <span className="value">
                  {transaction.senderLocation.city || 'Unknown'}, {transaction.senderLocation.country || 'Unknown'}
                </span>
              </div>
            )}
            <div className="receipt-row">
              <span className="label">To:</span>
              <span className="value">
                {transaction.receiver?.name || transaction.receiver?.phone || 'N/A'}
              </span>
            </div>
            {transaction.receiverLocation && (
              <div className="receipt-row">
                <span className="label">To Location:</span>
                <span className="value">
                  {transaction.receiverLocation.city || 'Unknown'}, {transaction.receiverLocation.country || 'Unknown'}
                </span>
              </div>
            )}
          </div>

          <div className="receipt-section">
            <h3>Amount Details</h3>
            <table className="receipt-table">
              <thead>
                <tr><th>Description</th><th>SSP</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Transaction Amount</td>
                  <td className="amount-cell">SSP { (parseFloat(transaction.amount) || 0).toFixed(2) }</td>
                </tr>
                {transaction.agentCommission !== undefined && (
                  <tr>
                    <td>Agent Commission ({transaction.agentCommissionPercent}%)</td>
                    <td className="amount-cell">SSP { (parseFloat(transaction.agentCommission) || 0).toFixed(2) }</td>
                  </tr>
                )}
                {transaction.companyCommission !== undefined && (
                  <tr>
                    <td>Company Commission ({transaction.companyCommissionPercent}%)</td>
                    <td className="amount-cell">SSP { (parseFloat(transaction.companyCommission) || 0).toFixed(2) }</td>
                  </tr>
                )}
                <tr>
                  <td><strong>Total Commission Fee</strong></td>
                  <td className="amount-cell">SSP { ((parseFloat(transaction.agentCommission) || 0) + (parseFloat(transaction.companyCommission) || 0)).toFixed(2) }</td>
                </tr>
                <tr>
                  <td><strong>Total User Pays</strong></td>
                  <td className="amount-cell">SSP { ((parseFloat(transaction.amount) || 0) + (parseFloat(transaction.agentCommission) || 0) + (parseFloat(transaction.companyCommission) || 0)).toFixed(2) }</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="receipt-section">
            <h3>Status</h3>
            <div className="receipt-row">
              <span className="label">Status:</span>
              <span className={`value status-${transaction.status}`}>
                {transaction.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            {transaction.description && (
              <div className="receipt-row">
                <span className="label">Description:</span>
                <span className="value">{transaction.description}</span>
              </div>
            )}
          </div>

          <div className="receipt-footer">
            <p>Thank you for using MoneyPay</p>
            <p className="print-instruction">Print this receipt for your records</p>
          </div>
        </div>

        <div className="print-receipt-actions">
          <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print Receipt</button>
          <button className="btn btn-secondary" onClick={handleNativePrint}>🖨️ Quick Print</button>
          <button className="btn btn-primary" onClick={() => generateTransactionDocument(transaction)}>📥 Download PDF</button>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
