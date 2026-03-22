<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1durYjZBaqNv5ZohTxeMF8uOpYx4AAscH

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root (copy from `env.example`):
   - **Gemini (optional):** `GEMINI_API_KEY=your_api_key_here`
   - **QcomPl (grocery live search):** For live Blinkit & Swiggy Instamart prices, set `QCOMPL_API_URL` and `QCOMPL_API_KEY` in the backend `.env`. Start the backend with `cd backend && npm run dev`.
   - **Address search (Uber-style):** The location picker calls `GET /api/location/autocomplete` on the same backend (OpenStreetMap Nominatim, India). Run the backend and set `VALYUX_API_URL` in the frontend `.env` so autocomplete works.
3. Run the app:
   ```bash
   npm run dev
   ```
   Opens at http://localhost:1234 (Parcel default).

### Backend: fuzzy merge & edge-case tests

QuickCommerce search results are merged with **string similarity + quantity matching**. Automated checks:

```bash
cd backend && npm run test:qc
```

Covers: multi-platform merge, **1 L vs 500 ml split**, quantity formatting (`500 ml` vs `500ml`), empty brands, duplicate offers per platform, unmapped platforms (e.g. DMart), missing quantity fields, and price edge cases.

## Deploy

1. Build for production:
   ```bash
   npm run build
   ```
   Output is in the `dist/` folder.

2. Deploy the `dist/` folder to any static host:
   - **Vercel:** `npx vercel dist --prod` (or connect repo and set build command: `parcel build index.html`, output: `dist`)
   - **Netlify:** Drag `dist` to [Netlify Drop](https://app.netlify.com/drop), or connect repo and set build command: `parcel build index.html`, publish directory: `dist`
   - **GitHub Pages / any host:** Upload the contents of `dist/` to your server.

Set `GEMINI_API_KEY` in your host’s environment variables if the app needs the API in production.
