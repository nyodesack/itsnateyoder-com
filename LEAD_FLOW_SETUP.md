# Lead Magnet + HighLevel Setup

This repo now supports a two-part setup:

1. **Static website** (GitHub Pages or similar) for the public lead magnet pages
2. **Cloudflare Worker** for secure server-side HighLevel contact creation

## Why this split exists
GitHub Pages is static-only. You should not expose HighLevel API credentials in browser JavaScript.

The Worker acts as a secure bridge:
- website sends lead data to Worker
- Worker upserts the contact into HighLevel
- Worker returns a download URL
- browser starts the download immediately

---

## Files added
- `js/lead-magnet.js`
- `workers/ghl-leads/wrangler.toml`
- `workers/ghl-leads/src/index.js`
- `downloads/README.md`

---

## Required secrets / vars
For the Worker:

### Secrets
- `GHL_TOKEN`

### Vars
- `GHL_LOCATION_ID`
- `ALLOWED_ORIGIN`
- `DOWNLOAD_BASE_URL`

Example production values:
- `ALLOWED_ORIGIN=https://www.itsnateyoder.com`
- `DOWNLOAD_BASE_URL=https://www.itsnateyoder.com/downloads`

---

## Deploy the Worker
From `workers/ghl-leads/`:

```bash
npm install -g wrangler
wrangler login
wrangler secret put GHL_TOKEN
wrangler deploy --var GHL_LOCATION_ID=YOUR_LOCATION_ID --var ALLOWED_ORIGIN=https://www.itsnateyoder.com --var DOWNLOAD_BASE_URL=https://www.itsnateyoder.com/downloads
```

After deploy, copy the Worker URL, for example:

```text
https://itsnateyoder-ghl-leads.<subdomain>.workers.dev
```

Then set that as the form webhook target in the HTML pages.

---

## Add the PDFs
Put the real downloadable PDFs into `downloads/`:

- `ultimate-sop-framework.pdf`
- `business-systems-guide.pdf`
- `partnership-blueprint.pdf`
- `faith-blueprint.pdf`
- `revenue-playbook.pdf`

---

## Front-end behavior
Each lead magnet page now:
- collects first name + email
- posts to the configured webhook
- if the primary HighLevel webhook fails, can fall back to a second lead endpoint
- waits for success
- uses `downloadUrl` returned by the endpoint when available
- falls back to the page-configured download URL if needed

### Fallback mode: notify Nate directly
If you want a simpler first live version, the front-end can point `data-fallback-webhook-url` at a tiny endpoint that does two things:
1. sends Nate the captured lead details
2. returns `{ "ok": true, "downloadUrl": "https://...pdf" }`

Payload sent by the page:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "leadMagnet": "Ultimate SOP Framework",
  "source": "website",
  "sourcePage": "https://www.itsnateyoder.com/lead-magnet.html",
  "tags": ["Website Lead", "Lead Magnet", "Ultimate SOP Framework"]
}
```

Minimum successful response:

```json
{
  "ok": true,
  "downloadUrl": "https://www.itsnateyoder.com/downloads/ultimate-sop-framework.pdf"
}
```

---

## Test checklist
1. Open a lead magnet page locally or in staging
2. Submit a test lead
3. Confirm:
   - success state appears
   - download starts
   - contact shows up in HighLevel
   - tags are applied
4. Repeat on production domain to verify CORS/origin behavior

---

## Hard blockers that still require real assets/config
- Real `GHL_TOKEN`
- Real `GHL_LOCATION_ID`
- Real PDF files in `downloads/`

Without those, the structure is ready but production lead capture/download cannot be fully verified.
