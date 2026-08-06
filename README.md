# Hygiene Matic — Manufacturing OS

A premium SaaS-style Manufacturing ERP for a cleaning products manufacturer, built with React + Vite + Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## What's inside

- **Dashboard** — today's production/cost/sales/profit, recent batch, low stock alerts, top products by volume, monthly profit trend, quick actions
- **Products** — full CRUD catalog
- **Formula Library** — per-product 1L base formulas with ingredient editor and version history (save/revert)
- **Batch Calculator** — live scaling to any batch size (presets or custom), signature liquid-fill visualization, side-by-side batch comparison
- **Raw Materials** — editable prices/stock with price-impact preview (shows which products are affected before you save)
- **Packaging** — editable bottle/cap/label/carton pricing, also with price-impact preview
- **Production** — plan a batch, run the checklist + mixing timer + QR code, then confirm to auto-deduct inventory
- **Inventory** — raw material + packaging stock levels with manual adjustment
- **Cost & Profit** — full cost breakdown, CGST/SGST (overridable per product), margin/markup/gross/net profit
- **Reports** — daily production, monthly production, raw material consumption, profit — exportable as PDF or Excel
- **Batch History** — searchable/filterable log of every batch
- **Users** — team management (roles only; full auth arrives with a real backend)
- **Settings** — company info, GST defaults, overhead cost defaults, currency, backup/restore (JSON export/import of all local data)

## Architecture notes for future backend integration

- All data currently lives in `localStorage` via Zustand's `persist` middleware (see `src/store/`). Each store exposes plain CRUD functions (`add`, `update`, `delete`, `getById`), so swapping the internals for Supabase/PostgreSQL calls later shouldn't require touching any page component.
- `src/utils/costEngine.js` is the single source of truth for every cost/profit number in the app — Dashboard, Batch Calculator, Cost & Profit, and Reports all call the same functions, so a raw material price edit instantly and correctly ripples everywhere.
- Formulas are always defined for **1 Liter**; batch scaling is a straight multiplication (`src/utils/units.js` handles ml/L/gm/Kg conversion, assuming density ≈ 1 for these water-based formulations).
- Keyboard shortcut: **⌘K / Ctrl+K** opens the command palette for quick navigation.

## Demo data

The app ships pre-seeded with 8 products (matching a real cleaning-products lineup), 21 raw materials, 8 packaging items, and ~12 batch history records (including two "today" batches so the Dashboard always has live activity) — all editable/deletable from the UI.
