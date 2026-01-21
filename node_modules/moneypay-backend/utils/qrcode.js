import QRCode from 'qrcode';

export const generateQRCode = async (phoneNumber) => {
  try {
    const qrData = JSON.stringify({
      type: 'transfer',
      recipient: phoneNumber,
      timestamp: Date.now()
    });

    const qrCode = await QRCode.toDataURL(qrData);
    return qrCode;
  } catch (error) {
    console.error('QR Code Error:', error);
    throw error;
  }
};

export const decodeQRCode = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error('QR Decode Error:', error);
    throw error;
  }
};
