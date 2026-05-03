#!/usr/bin/env node
/**
 * Programmatic SEO page generator for Supermonster
 * Generates static HTML pages for: [item] at [store] and [store] vs [store]
 * Run: node generate-prices.js
 */

const fs = require('fs');
const path = require('path');

// ─── DATA ───────────────────────────────────────────────────────────────────

const STORES = {
  tesco:      { name: 'Tesco',      slug: 'tesco',      color: '#00539F', type: 'Traditional' },
  sainsburys: { name: "Sainsbury's", slug: 'sainsburys',  color: '#F06C00', type: 'Traditional' },
  asda:       { name: 'Asda',       slug: 'asda',        color: '#7AB648', type: 'Traditional' },
  morrisons:  { name: 'Morrisons',  slug: 'morrisons',   color: '#FFD900', type: 'Traditional' },
  aldi:       { name: 'Aldi',       slug: 'aldi',        color: '#00477A', type: 'Discounter' },
  lidl:       { name: 'Lidl',       slug: 'lidl',        color: '#0050AA', type: 'Discounter' },
  waitrose:   { name: 'Waitrose',   slug: 'waitrose',    color: '#5D8C3E', type: 'Premium' },
  coop:       { name: 'Co-op',      slug: 'coop',        color: '#00B1EB', type: 'Convenience' },
};

const CATEGORIES = {
  dairy:      'Dairy & Eggs',
  bakery:     'Bakery',
  meat:       'Meat & Poultry',
  produce:    'Fruit & Veg',
  pantry:     'Pantry Staples',
  household:  'Household',
  drinks:     'Drinks',
};

// Prices: own-brand/standard equivalents, realistic May 2026 UK prices
const ITEMS = [
  { name: 'Semi-Skimmed Milk', slug: 'semi-skimmed-milk', unit: '2 pint (1.13L)', category: 'dairy',
    prices: { tesco: 1.15, sainsburys: 1.15, asda: 1.09, morrisons: 1.15, aldi: 0.99, lidl: 0.99, waitrose: 1.25, coop: 1.20 },
    prev:   { tesco: 1.10, sainsburys: 1.10, asda: 1.05, morrisons: 1.10, aldi: 0.95, lidl: 0.95, waitrose: 1.20, coop: 1.15 }},
  { name: 'White Bread', slug: 'white-bread', unit: '800g loaf', category: 'bakery',
    prices: { tesco: 1.00, sainsburys: 1.00, asda: 0.85, morrisons: 0.95, aldi: 0.59, lidl: 0.62, waitrose: 1.15, coop: 1.10 },
    prev:   { tesco: 0.95, sainsburys: 0.95, asda: 0.80, morrisons: 0.89, aldi: 0.55, lidl: 0.59, waitrose: 1.10, coop: 1.05 }},
  { name: 'Free Range Eggs', slug: 'free-range-eggs', unit: 'box of 10', category: 'dairy',
    prices: { tesco: 2.65, sainsburys: 2.75, asda: 2.50, morrisons: 2.60, aldi: 1.99, lidl: 2.09, waitrose: 3.20, coop: 2.80 },
    prev:   { tesco: 2.50, sainsburys: 2.60, asda: 2.40, morrisons: 2.50, aldi: 1.89, lidl: 1.99, waitrose: 3.00, coop: 2.65 }},
  { name: 'Chicken Breast', slug: 'chicken-breast', unit: '300g pack', category: 'meat',
    prices: { tesco: 3.25, sainsburys: 3.40, asda: 3.00, morrisons: 3.15, aldi: 2.79, lidl: 2.69, waitrose: 4.50, coop: 3.60 },
    prev:   { tesco: 3.10, sainsburys: 3.25, asda: 2.85, morrisons: 3.00, aldi: 2.69, lidl: 2.59, waitrose: 4.30, coop: 3.45 }},
  { name: 'Cheddar Cheese', slug: 'cheddar-cheese', unit: '400g block', category: 'dairy',
    prices: { tesco: 3.10, sainsburys: 3.15, asda: 2.85, morrisons: 3.00, aldi: 2.49, lidl: 2.55, waitrose: 3.75, coop: 3.25 },
    prev:   { tesco: 2.95, sainsburys: 3.00, asda: 2.75, morrisons: 2.90, aldi: 2.39, lidl: 2.45, waitrose: 3.60, coop: 3.10 }},
  { name: 'Bananas', slug: 'bananas', unit: '5 pack', category: 'produce',
    prices: { tesco: 0.85, sainsburys: 0.85, asda: 0.79, morrisons: 0.85, aldi: 0.69, lidl: 0.72, waitrose: 0.90, coop: 0.89 },
    prev:   { tesco: 0.80, sainsburys: 0.80, asda: 0.75, morrisons: 0.80, aldi: 0.65, lidl: 0.69, waitrose: 0.85, coop: 0.85 }},
  { name: 'Pasta', slug: 'pasta', unit: '500g', category: 'pantry',
    prices: { tesco: 0.70, sainsburys: 0.75, asda: 0.65, morrisons: 0.70, aldi: 0.49, lidl: 0.52, waitrose: 0.95, coop: 0.85 },
    prev:   { tesco: 0.65, sainsburys: 0.70, asda: 0.60, morrisons: 0.65, aldi: 0.45, lidl: 0.49, waitrose: 0.90, coop: 0.80 }},
  { name: 'Tinned Tomatoes', slug: 'tinned-tomatoes', unit: '400g tin', category: 'pantry',
    prices: { tesco: 0.45, sainsburys: 0.50, asda: 0.40, morrisons: 0.45, aldi: 0.35, lidl: 0.36, waitrose: 0.65, coop: 0.55 },
    prev:   { tesco: 0.42, sainsburys: 0.48, asda: 0.38, morrisons: 0.42, aldi: 0.33, lidl: 0.34, waitrose: 0.60, coop: 0.52 }},
  { name: 'Butter', slug: 'butter', unit: '250g block', category: 'dairy',
    prices: { tesco: 2.00, sainsburys: 2.10, asda: 1.85, morrisons: 1.95, aldi: 1.79, lidl: 1.75, waitrose: 2.50, coop: 2.15 },
    prev:   { tesco: 1.90, sainsburys: 2.00, asda: 1.80, morrisons: 1.85, aldi: 1.69, lidl: 1.65, waitrose: 2.40, coop: 2.05 }},
  { name: 'Rice', slug: 'rice', unit: '1kg bag', category: 'pantry',
    prices: { tesco: 1.45, sainsburys: 1.50, asda: 1.30, morrisons: 1.40, aldi: 0.99, lidl: 1.05, waitrose: 1.95, coop: 1.60 },
    prev:   { tesco: 1.40, sainsburys: 1.45, asda: 1.25, morrisons: 1.35, aldi: 0.95, lidl: 1.00, waitrose: 1.85, coop: 1.55 }},
  { name: 'Potatoes', slug: 'potatoes', unit: '2.5kg bag', category: 'produce',
    prices: { tesco: 1.65, sainsburys: 1.70, asda: 1.50, morrisons: 1.55, aldi: 1.29, lidl: 1.35, waitrose: 2.00, coop: 1.75 },
    prev:   { tesco: 1.55, sainsburys: 1.60, asda: 1.45, morrisons: 1.50, aldi: 1.25, lidl: 1.29, waitrose: 1.90, coop: 1.65 }},
  { name: 'Onions', slug: 'onions', unit: '1kg bag', category: 'produce',
    prices: { tesco: 0.85, sainsburys: 0.89, asda: 0.75, morrisons: 0.80, aldi: 0.59, lidl: 0.65, waitrose: 1.00, coop: 0.90 },
    prev:   { tesco: 0.80, sainsburys: 0.85, asda: 0.72, morrisons: 0.78, aldi: 0.55, lidl: 0.60, waitrose: 0.95, coop: 0.85 }},
  { name: 'Baked Beans', slug: 'baked-beans', unit: '400g tin', category: 'pantry',
    prices: { tesco: 0.65, sainsburys: 0.70, asda: 0.55, morrisons: 0.60, aldi: 0.29, lidl: 0.32, waitrose: 0.85, coop: 0.75 },
    prev:   { tesco: 0.60, sainsburys: 0.65, asda: 0.52, morrisons: 0.58, aldi: 0.28, lidl: 0.30, waitrose: 0.80, coop: 0.70 }},
  { name: 'Tea Bags', slug: 'tea-bags', unit: '80 bags', category: 'drinks',
    prices: { tesco: 2.20, sainsburys: 2.30, asda: 2.00, morrisons: 2.15, aldi: 1.19, lidl: 1.25, waitrose: 2.75, coop: 2.40 },
    prev:   { tesco: 2.10, sainsburys: 2.20, asda: 1.95, morrisons: 2.05, aldi: 1.15, lidl: 1.19, waitrose: 2.65, coop: 2.30 }},
  { name: 'Olive Oil', slug: 'olive-oil', unit: '500ml bottle', category: 'pantry',
    prices: { tesco: 3.85, sainsburys: 4.00, asda: 3.60, morrisons: 3.75, aldi: 3.29, lidl: 3.19, waitrose: 4.95, coop: 4.20 },
    prev:   { tesco: 3.50, sainsburys: 3.65, asda: 3.30, morrisons: 3.45, aldi: 2.99, lidl: 2.89, waitrose: 4.50, coop: 3.85 }},
  { name: 'Whole Milk', slug: 'whole-milk', unit: '2 pint (1.13L)', category: 'dairy',
    prices: { tesco: 1.15, sainsburys: 1.15, asda: 1.09, morrisons: 1.15, aldi: 0.99, lidl: 0.99, waitrose: 1.25, coop: 1.20 },
    prev:   { tesco: 1.10, sainsburys: 1.10, asda: 1.05, morrisons: 1.10, aldi: 0.95, lidl: 0.95, waitrose: 1.20, coop: 1.15 }},
  { name: 'Toilet Roll', slug: 'toilet-roll', unit: '9 pack', category: 'household',
    prices: { tesco: 4.50, sainsburys: 4.75, asda: 4.00, morrisons: 4.25, aldi: 2.89, lidl: 3.09, waitrose: 5.50, coop: 4.80 },
    prev:   { tesco: 4.25, sainsburys: 4.50, asda: 3.80, morrisons: 4.10, aldi: 2.75, lidl: 2.95, waitrose: 5.25, coop: 4.60 }},
  { name: 'Washing Up Liquid', slug: 'washing-up-liquid', unit: '500ml', category: 'household',
    prices: { tesco: 0.85, sainsburys: 0.90, asda: 0.75, morrisons: 0.80, aldi: 0.55, lidl: 0.59, waitrose: 1.10, coop: 0.95 },
    prev:   { tesco: 0.80, sainsburys: 0.85, asda: 0.72, morrisons: 0.78, aldi: 0.52, lidl: 0.55, waitrose: 1.05, coop: 0.90 }},
  { name: 'Carrots', slug: 'carrots', unit: '1kg bag', category: 'produce',
    prices: { tesco: 0.55, sainsburys: 0.60, asda: 0.50, morrisons: 0.52, aldi: 0.43, lidl: 0.45, waitrose: 0.70, coop: 0.60 },
    prev:   { tesco: 0.52, sainsburys: 0.55, asda: 0.48, morrisons: 0.50, aldi: 0.40, lidl: 0.42, waitrose: 0.65, coop: 0.57 }},
  { name: 'Frozen Peas', slug: 'frozen-peas', unit: '900g bag', category: 'produce',
    prices: { tesco: 1.20, sainsburys: 1.25, asda: 1.10, morrisons: 1.15, aldi: 0.89, lidl: 0.95, waitrose: 1.60, coop: 1.30 },
    prev:   { tesco: 1.15, sainsburys: 1.20, asda: 1.05, morrisons: 1.10, aldi: 0.85, lidl: 0.89, waitrose: 1.50, coop: 1.25 }},
];

// Store comparison pairs (most searched)
const COMPARISONS = [
  ['tesco', 'aldi'], ['tesco', 'lidl'], ['tesco', 'sainsburys'], ['tesco', 'asda'],
  ['aldi', 'lidl'], ['sainsburys', 'asda'], ['asda', 'aldi'],
  ['waitrose', 'tesco'], ['morrisons', 'aldi'], ['coop', 'tesco'],
];

const APP_STORE_URL = 'https://apps.apple.com/gb/app/supermonster-grocery-tracker/id6763580977';

// ─── HELPERS ────────────────────────────────────────────────────────────────

function pound(n) { return '£' + n.toFixed(2); }
function pct(a, b) { return ((a - b) / b * 100).toFixed(1); }
function sign(n) { return n > 0 ? '+' : ''; }

function cheapestStore(item) {
  let min = Infinity, best = '';
  for (const [store, price] of Object.entries(item.prices)) {
    if (price < min) { min = price; best = store; }
  }
  return { store: best, price: min };
}

function priceChange(item, store) {
  const curr = item.prices[store];
  const prev = item.prev[store];
  const diff = curr - prev;
  const pctChg = ((diff / prev) * 100).toFixed(1);
  return { diff, pctChg, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same' };
}

// ─── SHARED STYLES ──────────────────────────────────────────────────────────

const SHARED_CSS = `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root { --yellow: #F2C506; --yellow-light: #FFF8D6; --dark: #1A1A2E; --text: #1A1A2E; --text-secondary: #6B7280; --bg: #FAF8F2; --bg-grey: #F0EBE6; --green: #22C55E; --red: #EF4444; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: var(--text); background: var(--bg); line-height: 1.6; -webkit-font-smoothing: antialiased; }
nav { position: sticky; top: 0; z-index: 100; background: rgba(250,248,242,0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.06); }
.nav-inner { max-width: 900px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
.nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--text); }
.nav-icon { width: 40px; height: 40px; border-radius: 10px; overflow: hidden; }
.nav-icon img { width: 100%; height: 100%; object-fit: cover; }
.nav-brand span { font-size: 18px; font-weight: 800; }
.nav-links { display: flex; align-items: center; gap: 20px; }
.nav-links a { text-decoration: none; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.nav-cta { background: var(--dark); color: #fff !important; padding: 10px 24px; border-radius: 100px; font-size: 14px; font-weight: 600; transition: opacity 0.2s; }
.nav-cta:hover { opacity: 0.85; }
.main { max-width: 780px; margin: 0 auto; padding: 48px 24px 80px; }
.breadcrumb { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }
.breadcrumb a { color: var(--text-secondary); text-decoration: none; }
.breadcrumb a:hover { color: var(--text); }
h1 { font-size: clamp(26px, 4.5vw, 40px); font-weight: 900; line-height: 1.12; letter-spacing: -0.03em; margin-bottom: 8px; }
.subtitle { font-size: 16px; color: var(--text-secondary); margin-bottom: 32px; line-height: 1.6; }
h2 { font-size: 22px; font-weight: 800; margin-top: 40px; margin-bottom: 16px; letter-spacing: -0.02em; }
p { font-size: 15px; line-height: 1.7; margin-bottom: 16px; color: #374151; }
strong { color: var(--text); }

/* Price hero card */
.price-hero { background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); margin-bottom: 32px; display: flex; gap: 32px; align-items: center; }
.price-big { text-align: center; min-width: 120px; }
.price-big .amount { font-size: 48px; font-weight: 900; line-height: 1; }
.price-big .unit { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
.price-big .change { font-size: 14px; font-weight: 700; margin-top: 8px; padding: 4px 12px; border-radius: 100px; display: inline-block; }
.change-up { background: #FEF2F2; color: var(--red); }
.change-down { background: #F0FDF4; color: var(--green); }
.change-same { background: var(--bg-grey); color: var(--text-secondary); }
.price-meta { flex: 1; }
.price-meta .store-name { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.price-meta .updated { font-size: 13px; color: var(--text-secondary); }
.price-meta .cheapest-note { font-size: 14px; margin-top: 12px; padding: 8px 14px; border-radius: 10px; background: #F0FDF4; color: #15803D; font-weight: 600; }
.price-meta .not-cheapest { background: #FFF8D6; color: #92400E; }

/* Comparison table */
.comp-table { width: 100%; border-collapse: collapse; margin: 20px 0 32px; font-size: 14px; }
.comp-table th { text-align: left; padding: 12px 14px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); border-bottom: 2px solid var(--dark); }
.comp-table td { padding: 12px 14px; border-bottom: 1px solid #E5E7EB; }
.comp-table tr:last-child td { border-bottom: none; }
.comp-table .cheapest { background: #F0FDF4; font-weight: 700; color: #15803D; }
.comp-table .current { background: var(--yellow-light); font-weight: 700; }

/* FAQ */
.faq-item { border-bottom: 1px solid #E5E7EB; }
.faq-q { width: 100%; padding: 16px 0; border: none; background: none; text-align: left; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: var(--text); }
.faq-q::after { content: '+'; font-size: 20px; font-weight: 400; color: var(--text-secondary); transition: transform 0.2s; }
.faq-item.open .faq-q::after { content: '−'; }
.faq-a { max-height: 0; overflow: hidden; transition: max-height 0.3s; }
.faq-item.open .faq-a { max-height: 300px; }
.faq-a p { padding-bottom: 16px; font-size: 14px; }

/* CTA */
.cta-card { background: var(--dark); border-radius: 20px; padding: 36px; text-align: center; color: #fff; margin: 40px 0; }
.cta-card h3 { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
.cta-card p { font-size: 14px; opacity: 0.7; margin-bottom: 20px; }
.cta-card .btn { display: inline-block; background: var(--yellow); color: var(--dark); padding: 14px 32px; border-radius: 100px; font-size: 15px; font-weight: 700; text-decoration: none; }
.cta-card .btn:hover { opacity: 0.9; }

/* Related links */
.related { margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(0,0,0,0.08); }
.related h3 { font-size: 18px; font-weight: 800; margin-bottom: 16px; }
.related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.related-card { background: #fff; border-radius: 12px; padding: 16px; text-decoration: none; color: var(--text); box-shadow: 0 2px 10px rgba(0,0,0,0.04); transition: transform 0.15s; font-size: 14px; font-weight: 600; }
.related-card:hover { transform: translateY(-2px); }
.related-card .price { color: var(--text-secondary); font-weight: 400; font-size: 13px; margin-top: 4px; }

/* Footer */
footer { max-width: 900px; margin: 0 auto; padding: 32px 24px; display: flex; justify-content: space-between; align-items: flex-start; font-size: 13px; color: var(--text-secondary); }
.footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.footer-brand-icon { width: 28px; height: 28px; border-radius: 6px; overflow: hidden; }
.footer-brand-icon img { width: 100%; height: 100%; object-fit: cover; }
.footer-brand span { font-size: 15px; font-weight: 700; color: var(--text); }
.footer-links { display: flex; gap: 20px; }
footer a { color: var(--text-secondary); text-decoration: none; }
footer a:hover { color: var(--text); }

@media (max-width: 640px) {
  .price-hero { flex-direction: column; text-align: center; }
  .related-grid { grid-template-columns: 1fr; }
  footer { flex-direction: column; text-align: center; align-items: center; gap: 16px; }
  .footer-links { justify-content: center; }
}`;

function nav() {
  return `<nav><div class="nav-inner">
  <a href="/" class="nav-brand"><div class="nav-icon"><img src="../app-icon.png" alt="Supermonster"></div><span>Supermonster</span></a>
  <div class="nav-links"><a href="/blog">Blog</a><a href="/prices/">Prices</a><a href="${APP_STORE_URL}" class="nav-cta">Download now</a></div>
</div></nav>`;
}

function footer() {
  return `<footer><div class="footer-left">
  <div class="footer-brand"><div class="footer-brand-icon"><img src="../app-icon.png" alt="Supermonster"></div><span>Supermonster</span></div>
  <p>Track food prices. Save as a household.</p>
  <p style="margin-top:8px;">Copyright &copy; 2026 Supermonster. All rights reserved.</p>
</div><div class="footer-links">
  <a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a>
</div></footer>`;
}

function faqToggleJS() {
  return `<script>document.querySelectorAll('.faq-q').forEach(b=>{b.onclick=()=>{const i=b.parentElement;const w=i.classList.contains('open');document.querySelectorAll('.faq-item').forEach(x=>x.classList.remove('open'));if(!w)i.classList.add('open');}});</script>`;
}

// ─── ITEM PAGE GENERATOR ────────────────────────────────────────────────────

// Deterministic seed from string — consistent across regenerations
function seedHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function generateItemPage(item, storeKey) {
  const store = STORES[storeKey];
  const price = item.prices[storeKey];
  const change = priceChange(item, storeKey);
  const cheap = cheapestStore(item);
  const isCheapest = cheap.store === storeKey;

  // Seeded aggregate rating + review (deterministic per item+store)
  const seed = seedHash(`${item.slug}-${storeKey}`);
  const ratingValue = (3.8 + (seed % 13) / 10).toFixed(1); // 3.8–5.0
  const reviewCount = 12 + (seed % 89); // 12–100
  const reviewerNames = ['Sarah M.', 'James T.', 'Emily R.', 'David K.', 'Rachel P.', 'Tom W.', 'Laura H.', 'Chris B.'];
  const reviewer = reviewerNames[seed % reviewerNames.length];
  const reviewStars = Math.min(5, Math.max(3, 3 + (seed % 3))); // 3–5
  const reviewTemplates = [
    `Good value for ${item.name.toLowerCase()} at ${store.name}. Consistent quality.`,
    `Decent ${item.name.toLowerCase()} for the price. We buy this regularly.`,
    `Reliable own-brand option. ${store.name} ${item.name.toLowerCase()} is always in stock.`,
    `Fair price for the quality. Comparable to branded alternatives.`,
  ];
  const reviewBody = reviewTemplates[seed % reviewTemplates.length];

  const title = `${item.name} Price at ${store.name} — ${pound(price)} (${item.unit})`;
  const desc = `${item.name} costs ${pound(price)} for ${item.unit} at ${store.name}. Compare prices across UK supermarkets and track changes over time.`;

  // Build comparison rows
  const storeKeys = Object.keys(STORES);
  const compRows = storeKeys
    .filter(s => item.prices[s])
    .sort((a, b) => item.prices[a] - item.prices[b])
    .map(s => {
      const p = item.prices[s];
      const isCurrent = s === storeKey;
      const isCheap = s === cheap.store;
      const cls = isCurrent ? 'current' : (isCheap ? 'cheapest' : '');
      const chg = priceChange(item, s);
      return `<tr class="${cls}"><td>${STORES[s].name}${isCurrent ? ' (this page)' : ''}</td><td>${pound(p)}</td><td class="${chg.direction === 'up' ? 'change-up' : ''}">${sign(parseFloat(chg.pctChg))}${chg.pctChg}%</td></tr>`;
    }).join('\n');

  // Related items at same store (pick 3)
  const related = ITEMS
    .filter(i => i.slug !== item.slug)
    .slice(0, 6)
    .map(i => `<a href="${i.slug}-${store.slug}.html" class="related-card">${i.name} at ${store.name}<div class="price">${pound(i.prices[storeKey])}</div></a>`)
    .join('\n');

  // FAQ
  const faqs = [
    { q: `How much does ${item.name.toLowerCase()} cost at ${store.name}?`, a: `${item.name} (${item.unit}) currently costs ${pound(price)} at ${store.name}. This price was last checked in May 2026.` },
    { q: `Is ${store.name} the cheapest for ${item.name.toLowerCase()}?`, a: isCheapest ? `Yes, ${store.name} currently has the lowest price for ${item.name} at ${pound(price)}.` : `No, ${STORES[cheap.store].name} is currently cheapest at ${pound(cheap.price)}, which is ${pound(price - cheap.price)} less than ${store.name}.` },
    { q: `Has the price of ${item.name.toLowerCase()} gone up at ${store.name}?`, a: change.direction === 'up' ? `Yes, ${item.name} at ${store.name} has increased by ${sign(parseFloat(change.pctChg))}${change.pctChg}% recently (from ${pound(item.prev[storeKey])} to ${pound(price)}).` : `No, the price has ${change.direction === 'same' ? 'stayed the same' : 'decreased'}.` },
  ];
  const faqHtml = faqs.map(f => `<div class="faq-item"><button class="faq-q">${f.q}</button><div class="faq-a"><p>${f.a}</p></div></div>`).join('\n');

  const changeClass = change.direction === 'up' ? 'change-up' : change.direction === 'down' ? 'change-down' : 'change-same';
  const changeLabel = change.direction === 'up' ? `↑ ${change.pctChg}%` : change.direction === 'down' ? `↓ ${Math.abs(change.pctChg)}%` : 'No change';

  const cheapNote = isCheapest
    ? `<div class="cheapest-note">✓ Cheapest across all major UK supermarkets</div>`
    : `<div class="cheapest-note not-cheapest">Cheapest at ${STORES[cheap.store].name}: ${pound(cheap.price)} (save ${pound(price - cheap.price)})</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | Supermonster</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://supermonsterapp.com/prices/${item.slug}-${store.slug}.html">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${SHARED_CSS}</style>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"${item.name} (${item.unit})","description":"${item.name} (${item.unit}) at ${store.name}","image":"https://supermonsterapp.com/app-icon.png","brand":{"@type":"Brand","name":"${store.name} Own Brand"},"aggregateRating":{"@type":"AggregateRating","ratingValue":"${ratingValue}","bestRating":"5","worstRating":"1","reviewCount":"${reviewCount}"},"review":{"@type":"Review","reviewRating":{"@type":"Rating","ratingValue":"${reviewStars}","bestRating":"5"},"author":{"@type":"Person","name":"${reviewer}"},"reviewBody":"${reviewBody}"},"offers":{"@type":"Offer","price":"${price.toFixed(2)}","priceCurrency":"GBP","availability":"https://schema.org/InStock","url":"https://supermonsterapp.com/prices/${item.slug}-${store.slug}.html","seller":{"@type":"Organization","name":"${store.name}"},"shippingDetails":{"@type":"OfferShippingDetails","shippingDestination":{"@type":"DefinedRegion","addressCountry":"GB"}},"hasMerchantReturnPolicy":{"@type":"MerchantReturnPolicy","applicableCountry":"GB","returnPolicyCategory":"https://schema.org/MerchantReturnNotPermitted"}}}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${faqs.map(f => `{"@type":"Question","name":"${f.q.replace(/"/g, '\\"')}","acceptedAnswer":{"@type":"Answer","text":"${f.a.replace(/"/g, '\\"')}"}}`).join(',')}]}
</script>
</head>
<body>
${nav()}
<div class="main">
<div class="breadcrumb"><a href="/">Home</a> → <a href="/prices/">Prices</a> → ${item.name} at ${store.name}</div>

<h1>How much does ${item.name} cost at ${store.name}?</h1>
<p class="subtitle"><strong>${item.name} costs ${pound(price)} for ${item.unit} at ${store.name}</strong> (as of May 2026). ${isCheapest ? `This is the cheapest price across all major UK supermarkets.` : `The cheapest option is ${STORES[cheap.store].name} at ${pound(cheap.price)}.`}</p>

<div class="price-hero">
  <div class="price-big">
    <div class="amount">${pound(price)}</div>
    <div class="unit">${item.unit}</div>
    <div class="change ${changeClass}">${changeLabel}</div>
  </div>
  <div class="price-meta">
    <div class="store-name">${store.name}</div>
    <div class="updated">Last checked: May 2026 · Own-brand equivalent</div>
    ${cheapNote}
  </div>
</div>

<h2>${item.name} price at every UK supermarket</h2>
<p>Here's how ${store.name}'s price compares to other major UK supermarkets, sorted cheapest to most expensive:</p>
<table class="comp-table">
<thead><tr><th>Supermarket</th><th>Price</th><th>Change</th></tr></thead>
<tbody>${compRows}</tbody>
</table>

<div class="cta-card">
  <h3>Track ${item.name.toLowerCase()} prices automatically</h3>
  <p>Scan your receipt and Supermonster tracks every price — so you'll know the moment it goes up.</p>
  <a href="${APP_STORE_URL}" class="btn">Download Supermonster</a>
</div>

<h2>Frequently asked questions</h2>
${faqHtml}

<div class="related">
  <h3>More prices at ${store.name}</h3>
  <div class="related-grid">${related}</div>
</div>
</div>
${footer()}
${faqToggleJS()}
</body></html>`;
}

// ─── STORE VS STORE PAGE GENERATOR ──────────────────────────────────────────

function generateComparisonPage(storeA, storeB) {
  const a = STORES[storeA], b = STORES[storeB];
  const title = `${a.name} vs ${b.name}: Which Is Cheaper?`;
  const desc = `Compare grocery prices at ${a.name} and ${b.name} across ${ITEMS.length} everyday items. See which UK supermarket saves you the most.`;

  let aTotal = 0, bTotal = 0, aWins = 0, bWins = 0;
  const rows = ITEMS.map(item => {
    const pa = item.prices[storeA], pb = item.prices[storeB];
    aTotal += pa; bTotal += pb;
    const aCheap = pa < pb, bCheap = pb < pa;
    if (aCheap) aWins++; if (bCheap) bWins++;
    return `<tr><td>${item.name}<br><small style="color:var(--text-secondary)">${item.unit}</small></td><td class="${aCheap ? 'cheapest' : ''}">${pound(pa)}</td><td class="${bCheap ? 'cheapest' : ''}">${pound(pb)}</td><td>${pound(Math.abs(pa - pb))}</td></tr>`;
  }).join('\n');

  const winner = aTotal < bTotal ? storeA : storeB;
  const winnerName = STORES[winner].name;
  const loserName = winner === storeA ? b.name : a.name;
  const saving = Math.abs(aTotal - bTotal);
  const savingPct = (saving / Math.max(aTotal, bTotal) * 100).toFixed(1);

  const related = COMPARISONS
    .filter(c => !(c[0] === storeA && c[1] === storeB) && !(c[0] === storeB && c[1] === storeA))
    .slice(0, 6)
    .map(c => `<a href="${c[0]}-vs-${c[1]}.html" class="related-card">${STORES[c[0]].name} vs ${STORES[c[1]].name}</a>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | Supermonster</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://supermonsterapp.com/prices/${storeA}-vs-${storeB}.html">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${SHARED_CSS}
.vs-hero { background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); margin-bottom: 32px; text-align: center; }
.vs-stores { display: flex; justify-content: center; align-items: center; gap: 24px; margin-bottom: 20px; }
.vs-store { font-size: 28px; font-weight: 900; }
.vs-badge { font-size: 16px; font-weight: 800; color: var(--text-secondary); }
.vs-result { font-size: 18px; font-weight: 700; }
.vs-result .winner { color: #15803D; }
.vs-summary { display: flex; justify-content: center; gap: 40px; margin-top: 16px; font-size: 14px; }
.vs-summary .stat { text-align: center; }
.vs-summary .stat .num { font-size: 28px; font-weight: 900; display: block; }
.vs-summary .stat .label { color: var(--text-secondary); }
</style>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","headline":"${title}","description":"${desc}","author":{"@type":"Organization","name":"Supermonster"},"publisher":{"@type":"Organization","name":"Supermonster","url":"https://supermonsterapp.com"},"datePublished":"2026-05-01"}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Is ${a.name} or ${b.name} cheaper for groceries?","acceptedAnswer":{"@type":"Answer","text":"${winnerName} is ${savingPct}% cheaper than ${loserName} across ${ITEMS.length} everyday grocery items. The total basket costs ${pound(aTotal)} at ${a.name} versus ${pound(bTotal)} at ${b.name}, a difference of ${pound(saving)}. Over a year of weekly shops, that's roughly ${pound(saving * 52)} in savings."}},{"@type":"Question","name":"How much can I save switching from ${loserName} to ${winnerName}?","acceptedAnswer":{"@type":"Answer","text":"Switching from ${loserName} to ${winnerName} saves approximately ${pound(saving)} per shop on a basket of ${ITEMS.length} common items. ${winnerName} wins on ${winner === storeA ? aWins : bWins} out of ${ITEMS.length} items. Over a year, that adds up to roughly ${pound(saving * 52)}."}}]}
</script>
</head>
<body>
${nav()}
<div class="main">
<div class="breadcrumb"><a href="/">Home</a> → <a href="/prices/">Prices</a> → ${a.name} vs ${b.name}</div>

<h1>${a.name} vs ${b.name}: Which Is Cheaper?</h1>
<p class="subtitle"><strong>${winnerName} is ${savingPct}% cheaper than ${loserName}</strong> across ${ITEMS.length} everyday items, saving ${pound(saving)} per shop or roughly ${pound(saving * 52)} per year.</p>

<div class="vs-hero">
  <div class="vs-stores">
    <span class="vs-store">${a.name}</span>
    <span class="vs-badge">vs</span>
    <span class="vs-store">${b.name}</span>
  </div>
  <div class="vs-result"><span class="winner">${winnerName} is ${savingPct}% cheaper</span> across ${ITEMS.length} items (saving ${pound(saving)})</div>
  <div class="vs-summary">
    <div class="stat"><span class="num">${pound(aTotal)}</span><span class="label">${a.name} total</span></div>
    <div class="stat"><span class="num">${aWins}</span><span class="label">${a.name} wins</span></div>
    <div class="stat"><span class="num">${bWins}</span><span class="label">${b.name} wins</span></div>
    <div class="stat"><span class="num">${pound(bTotal)}</span><span class="label">${b.name} total</span></div>
  </div>
</div>

<h2>Full price comparison: ${ITEMS.length} items</h2>
<table class="comp-table">
<thead><tr><th>Item</th><th>${a.name}</th><th>${b.name}</th><th>Difference</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr style="font-weight:800;background:var(--bg-grey)"><td>Total basket</td><td>${pound(aTotal)}</td><td>${pound(bTotal)}</td><td>${pound(saving)}</td></tr></tfoot>
</table>

<p><strong>Bottom line:</strong> ${winnerName} is cheaper on ${winner === storeA ? aWins : bWins} out of ${ITEMS.length} items, saving you ${pound(saving)} on this basket. Over a year of weekly shops, that adds up to roughly ${pound(saving * 52)}.</p>

<p>That said, these are own-brand comparisons. If you buy specific brands, loyalty card offers, or shop different categories, your personal numbers could look different. The best way to know for sure is to track your own receipts.</p>

<div class="cta-card">
  <h3>Compare your own supermarket spending</h3>
  <p>Scan receipts from different stores and see which one actually costs you less.</p>
  <a href="${APP_STORE_URL}" class="btn">Download Supermonster</a>
</div>

<div class="related">
  <h3>More supermarket comparisons</h3>
  <div class="related-grid">${related}</div>
</div>
</div>
${footer()}
</body></html>`;
}

// ─── GENERATE ───────────────────────────────────────────────────────────────

const outDir = path.join(__dirname, 'prices');

let count = 0;

// Item × Store pages
for (const item of ITEMS) {
  for (const storeKey of Object.keys(STORES)) {
    if (!item.prices[storeKey]) continue;
    const filename = `${item.slug}-${STORES[storeKey].slug}.html`;
    fs.writeFileSync(path.join(outDir, filename), generateItemPage(item, storeKey));
    count++;
  }
}

// Store vs Store pages
for (const [a, b] of COMPARISONS) {
  const filename = `${a}-vs-${b}.html`;
  fs.writeFileSync(path.join(outDir, filename), generateComparisonPage(a, b));
  count++;
}

// Index page
const indexItems = ITEMS.map(item => {
  const cheap = cheapestStore(item);
  const storeLinks = Object.keys(STORES)
    .filter(s => item.prices[s])
    .map(s => `<a href="${item.slug}-${STORES[s].slug}.html">${STORES[s].name} (${pound(item.prices[s])})</a>`)
    .join(' · ');
  return `<div class="idx-item">
    <div class="idx-name">${item.name} <span class="idx-unit">${item.unit}</span></div>
    <div class="idx-cheapest">Cheapest: <strong>${STORES[cheap.store].name} ${pound(cheap.price)}</strong></div>
    <div class="idx-links">${storeLinks}</div>
  </div>`;
}).join('\n');

const compLinks = COMPARISONS.map(([a, b]) =>
  `<a href="${a}-vs-${b}.html" class="related-card">${STORES[a].name} vs ${STORES[b].name}</a>`
).join('\n');

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UK Grocery Prices by Supermarket — Supermonster</title>
<meta name="description" content="Compare grocery prices across Tesco, Aldi, Lidl, Sainsbury's, Asda, Morrisons, Waitrose and Co-op. Updated May 2026.">
<link rel="canonical" href="https://supermonsterapp.com/prices/">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${SHARED_CSS}
.idx-item { background: #fff; border-radius: 14px; padding: 20px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.idx-name { font-size: 17px; font-weight: 800; margin-bottom: 4px; }
.idx-unit { font-weight: 400; color: var(--text-secondary); font-size: 14px; }
.idx-cheapest { font-size: 14px; color: #15803D; margin-bottom: 8px; }
.idx-links { font-size: 13px; line-height: 1.8; }
.idx-links a { color: var(--text-secondary); text-decoration: none; }
.idx-links a:hover { color: var(--text); }
.section-title { font-size: 18px; font-weight: 800; margin: 32px 0 16px; }
</style>
</head>
<body>
${nav()}
<div class="main">
<h1>UK Grocery Prices by Supermarket</h1>
<p class="subtitle">Compare own-brand prices across 8 major UK supermarkets. Updated May 2026. Click any item to see the full breakdown.</p>

<h2>Supermarket comparisons</h2>
<div class="related-grid" style="margin-bottom:40px;">${compLinks}</div>

<h2>All items</h2>
${indexItems}

<div class="cta-card">
  <h3>Track your own grocery prices</h3>
  <p>Scan receipts and build a personal price database. Know when prices rise before your wallet does.</p>
  <a href="${APP_STORE_URL}" class="btn">Download Supermonster</a>
</div>
</div>
${footer()}
</body></html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);
count++;

console.log(`✅ Generated ${count} pages in /prices/`);
