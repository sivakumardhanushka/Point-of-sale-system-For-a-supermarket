// Default high-resolution vector logo for supermarket invoices & thermal receipts
export const DEFAULT_STORE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <defs>
    <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%2310b981" />
      <stop offset="100%" stop-color="%23059669" />
    </linearGradient>
  </defs>
  <!-- Shopping Cart Icon Badge -->
  <rect x="10" y="8" width="64" height="64" rx="16" fill="url(%23cartGrad)" />
  <path d="M26 24 h6 l5 20 h22 l4 -14 h-28" fill="none" stroke="%23ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="39" cy="50" r="3.5" fill="%23ffffff" />
  <circle cx="55" cy="50" r="3.5" fill="%23ffffff" />
  <path d="M37 32 h16 M45 26 v12" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round" />

  <!-- Supermarket Brand Text -->
  <text x="88" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="%23111827" letter-spacing="1">ABC SUPERMARKET</text>
  <text x="88" y="55" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="10.5" fill="%23059669" letter-spacing="3">FRESH MART & GROCERY</text>
  <line x1="88" y1="62" x2="300" y2="62" stroke="%23e5e7eb" stroke-width="1.5" stroke-linecap="round" />
</svg>`;

// High-contrast monochrome SVG specifically optimized for thermal receipt paper
export const DEFAULT_MONO_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <!-- Shopping Cart Icon Badge in Pure Black -->
  <rect x="10" y="8" width="64" height="64" rx="14" fill="%23000000" />
  <path d="M26 24 h6 l5 20 h22 l4 -14 h-28" fill="none" stroke="%23ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="39" cy="50" r="3.5" fill="%23ffffff" />
  <circle cx="55" cy="50" r="3.5" fill="%23ffffff" />
  <path d="M37 32 h16 M45 26 v12" stroke="%23ffffff" stroke-width="2.8" stroke-linecap="round" />

  <!-- Supermarket Brand Text -->
  <text x="88" y="38" font-family="monospace, sans-serif" font-weight="900" font-size="23" fill="%23000000" letter-spacing="1.5">ABC SUPERMARKET</text>
  <text x="88" y="55" font-family="monospace, sans-serif" font-weight="800" font-size="11" fill="%23000000" letter-spacing="3.5">FRESH FOOD & GROCERY</text>
  <line x1="88" y1="62" x2="300" y2="62" stroke="%23000000" stroke-width="2" stroke-linecap="round" />
</svg>`;
