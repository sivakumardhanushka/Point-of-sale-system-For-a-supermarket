// Code 128B pattern table for pure SVG generation
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

function generateBarcodeSvg(value, barHeight = 28) {
  const text = String(value || '00000000');
  const symbols = [104]; // START_B
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    symbols.push(code >= 32 && code <= 126 ? code - 32 : 0);
  }
  let checksum = symbols[0];
  for (let i = 1; i < symbols.length; i++) {
    checksum += symbols[i] * i;
  }
  symbols.push(checksum % 103);
  symbols.push(106); // STOP

  const bars = [];
  symbols.forEach(sym => {
    const pattern = CODE128_PATTERNS[sym] || '212222';
    for (let i = 0; i < pattern.length; i++) {
      const width = parseInt(pattern[i], 10);
      const isBar = (i % 2 === 0);
      bars.push({ isBar, width });
    }
  });

  const totalModules = bars.reduce((sum, b) => sum + b.width, 0);
  const quietZone = 6;
  const svgWidth = totalModules + quietZone * 2;

  let currentX = quietZone;
  let rects = '';
  bars.forEach(bar => {
    if (bar.isBar) {
      rects += `<rect x="${currentX}" y="0" width="${bar.width}" height="${barHeight}" fill="#000000" />`;
    }
    currentX += bar.width;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${barHeight}" preserveAspectRatio="none" style="width: 100%; height: ${barHeight}px; display: block;">${rects}</svg>`;
}

export function generateLabelHtml(product, settings = {}) {
  const widthMm = Number(settings.labelWidth) || 50;
  const heightMm = Number(settings.labelHeight) || 30;
  const currency = settings.currency || 'Rs.';
  const storeName = settings.storeName || 'SUPERMARKET';
  const showStore = settings.labelShowStoreName !== false;
  const showName = settings.labelShowProductName !== false;
  const showBarcode = settings.labelShowBarcode !== false;
  const showPrice = settings.labelShowPrice !== false;
  const showExpiry = Boolean(settings.labelShowExpiry && product?.expiryDate);

  const barcodeVal = product?.barcode || '000000000000';
  const barcodeSvg = generateBarcodeSvg(barcodeVal, 22);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Label ${product?.name || ''}</title>
  <style>
    @page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      background: #ffffff;
      color: #000000;
      font-family: Arial, -apple-system, sans-serif;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label-container {
      width: 100%;
      height: 100%;
      padding: 1.5mm 2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }
    .store-name {
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      line-height: 1.1;
    }
    .product-name {
      font-size: 8.5pt;
      font-weight: bold;
      line-height: 1.15;
      max-height: 2.3em;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
    .barcode-section {
      width: 90%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 1px 0;
    }
    .barcode-text {
      font-family: 'Courier New', Courier, monospace;
      font-size: 7.5pt;
      font-weight: bold;
      letter-spacing: 1px;
      margin-top: 1px;
      line-height: 1;
    }
    .bottom-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 1mm;
      line-height: 1;
    }
    .expiry {
      font-size: 6.5pt;
      color: #333333;
      text-align: left;
    }
    .price {
      font-size: 11pt;
      font-weight: 900;
      font-family: Arial, sans-serif;
      text-align: right;
      letter-spacing: -0.3px;
    }
  </style>
</head>
<body>
  <div class="label-container">
    ${showStore ? `<div class="store-name">${storeName}</div>` : ''}
    ${showName ? `<div class="product-name">${product?.name || 'Item Name'}</div>` : ''}
    ${showBarcode ? `
      <div class="barcode-section">
        ${barcodeSvg}
        <div class="barcode-text">${barcodeVal}</div>
      </div>
    ` : ''}
    <div class="bottom-row">
      <div class="expiry">
        ${product?.unit ? `<span>${product.unit}</span><br/>` : ''}
        ${showExpiry ? `<span>Exp: ${product.expiryDate}</span>` : ''}
      </div>
      ${showPrice ? `<div class="price">${currency} ${Number(product?.sellingPrice || 0).toFixed(2)}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

export async function printProductLabel(product, settings = {}) {
  const html = generateLabelHtml(product, settings);
  const widthMm = Number(settings.labelWidth) || 50;
  const heightMm = Number(settings.labelHeight) || 30;
  const copies = Number(settings.labelCopies) || 1;
  const deviceName = settings.labelPrinterDriver || '';

  // 1. Electron Native Printer Driver Execution
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.printLabel) {
    return await window.electronAPI.printLabel({
      html,
      deviceName,
      widthMm,
      heightMm,
      copies,
      silent: false
    });
  }

  // 2. Browser Fallback: Hidden print iframe
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      Object.assign(iframe.style, {
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        border: 'none',
        visibility: 'hidden'
      });
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          resolve({ success: true });
        } catch (err) {
          resolve({ success: false, error: err.message });
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }, 350);
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}
