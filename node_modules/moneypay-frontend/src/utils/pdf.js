import jsPDF from 'jspdf';

// PDF generation using jsPDF
export const generateTransactionDocument = (tx) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 10;
    const margin = 8;
    const contentWidth = pageWidth - (margin * 2);
    const lineHeight = 6;

    // Helper functions
    const addText = (text, x, y, fontSize = 10, isBold = false, options = {}) => {
      pdf.setFontSize(fontSize);
      pdf.setFont(undefined, isBold ? 'bold' : 'normal');
      pdf.text(text, x, y, options);
    };

    const addBorder = (x, y, width, height) => {
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height);
    };

    const addLine = (y, startX = margin, endX = pageWidth - margin) => {
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(startX, y, endX, y);
    };

    const addRow = (label, value, y, labelWidth = 50) => {
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text(label + ':', margin + 1, y);
      
      // Wrap text if too long
      const maxWidth = contentWidth - labelWidth - 2;
      const splitValue = pdf.splitTextToSize(value, maxWidth);
      pdf.text(splitValue, margin + labelWidth, y);
      
      return splitValue.length > 1 ? (splitValue.length * lineHeight) : lineHeight;
    };

    const addSection = (title, y) => {
      addLine(y - 1);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text(title, margin + 2, y + 2);
      return y + 5;
    };

    // Main border
    addBorder(margin, 8, contentWidth, pageHeight - 16);

    // Header
    yPosition = 16;
    addText('MONEYPAY', pageWidth / 2, yPosition, 16, true, { align: 'center' });
    yPosition += 8;
    addText('TRANSACTION RECEIPT', pageWidth / 2, yPosition, 12, true, { align: 'center' });
    yPosition += 8;
    addLine(yPosition);
    yPosition += 4;

    // Receipt Details Section
    yPosition = addSection('RECEIPT DETAILS', yPosition);
    yPosition += addRow('Transaction ID', tx.transactionId, yPosition, 45);
    yPosition += addRow('Date & Time', new Date(tx.createdAt).toLocaleString(), yPosition, 45);
    yPosition += addRow('Type', tx.type, yPosition, 45);
    yPosition += 3;

    // Parties Section
    yPosition = addSection('PARTIES', yPosition);
    yPosition += addRow('From', tx.sender?.name || tx.sender?.phone || 'System', yPosition, 45);
    yPosition += addRow('To', tx.receiver?.name || tx.receiver?.phone || 'N/A', yPosition, 45);
    yPosition += 3;

    // Amount Details Section
    yPosition = addSection('AMOUNT DETAILS', yPosition);
    yPosition += addRow('Amount', `SSP ${(tx.amount || 0).toFixed(2)}`, yPosition, 45);
    
    if (tx.agentCommission !== undefined && tx.agentCommission > 0) {
      yPosition += addRow('Agent Commission', `SSP ${(tx.agentCommission || 0).toFixed(2)}`, yPosition, 45);
    }
    if (tx.companyCommission !== undefined && tx.companyCommission > 0) {
      yPosition += addRow('Company Commission', `SSP ${(tx.companyCommission || 0).toFixed(2)}`, yPosition, 45);
    }

    const totalCommission = (tx.agentCommission || 0) + (tx.companyCommission || 0);
    if (totalCommission > 0) {
      pdf.setFont(undefined, 'bold');
      yPosition += addRow('Total Commission', `SSP ${totalCommission.toFixed(2)}`, yPosition, 45);
      pdf.setFont(undefined, 'normal');
    }
    
    yPosition += addRow('Total Payable', `SSP ${((tx.amount || 0) + totalCommission).toFixed(2)}`, yPosition, 45);
    yPosition += 3;

    // Status Section
    yPosition = addSection('STATUS', yPosition);
    yPosition += addRow('Status', (tx.status || 'Unknown').toUpperCase(), yPosition, 45);
    
    if (tx.description) {
      yPosition += addRow('Description', tx.description, yPosition, 45);
    }

    // Footer
    addLine(pageHeight - 18);
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.text('Thank you for using MoneyPay', pageWidth / 2, pageHeight - 13, { align: 'center' });
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text('For support, contact: support@moneypay.com', pageWidth / 2, pageHeight - 7, { align: 'center' });

    // Download
    pdf.save(`transaction_${tx.transactionId}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
