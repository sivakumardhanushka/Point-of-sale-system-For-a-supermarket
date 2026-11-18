import React from 'react';

// Code 128B barcode pattern table (107 patterns: 0 to 106)
// Each pattern describes 6 widths (bar, space, bar, space, bar, space) summing to 11 modules
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP: 7 digits summing to 13)
];

const START_B = 104;
const STOP = 106;

export default function Barcode({ 
  value, 
  height = 48, 
  scale = 2, 
  showText = true, 
  className = '', 
  color = '#000000',
  bgColor = '#ffffff'
}) {
  const text = String(value || '00000000');
  
  // Encode characters into symbols
  const symbols = [START_B];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // ASCII 32 (' ') to 126 ('~') mapped to values 0..94
    if (code >= 32 && code <= 126) {
      symbols.push(code - 32);
    } else {
      symbols.push(0); // fallback space
    }
  }

  // Calculate Checksum
  let checksum = symbols[0];
  for (let i = 1; i < symbols.length; i++) {
    checksum += symbols[i] * i;
  }
  symbols.push(checksum % 103);
  symbols.push(STOP);

  // Convert symbols to modules (bars & spaces)
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
  const quietZone = 10;
  const svgWidth = (totalModules + quietZone * 2) * scale;
  const svgHeight = height + (showText ? 14 : 0);

  let currentX = quietZone * scale;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg 
        width={svgWidth} 
        height={height} 
        viewBox={`0 0 ${svgWidth} ${height}`} 
        className="block"
        style={{ backgroundColor: bgColor }}
      >
        {bars.map((bar, idx) => {
          const barW = bar.width * scale;
          const rect = bar.isBar ? (
            <rect 
              key={idx} 
              x={currentX} 
              y={0} 
              width={barW} 
              height={height} 
              fill={color} 
            />
          ) : null;
          currentX += barW;
          return rect;
        })}
      </svg>
      {showText && (
        <span 
          className="text-[10px] font-mono tracking-widest mt-0.5 font-bold" 
          style={{ color }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
