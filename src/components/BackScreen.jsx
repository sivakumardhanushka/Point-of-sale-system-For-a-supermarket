import React, { useEffect, useState } from 'react';

/**
 * BackScreen component displays the live Net Payable amount.
 * Intended to be opened in a separate window (e.g., second monitor).
 * The main POS page broadcasts updates via `window.postMessage({ netPayable })`.
 */
const BackScreen = () => {
  const [netPayable, setNetPayable] = useState(0);

  useEffect(() => {
    const handler = (event) => {
      if (event.data && typeof event.data.netPayable === 'number') {
        setNetPayable(event.data.netPayable);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-emerald-900 to-slate-900">
      <div className="text-center">
        <div className="text-2xl font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          Net Payable
        </div>
        <div className="text-6xl font-black font-mono text-white">${netPayable.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default BackScreen;
