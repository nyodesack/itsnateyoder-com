# Lead Magnet Downloads

Place the real downloadable PDFs in this folder using these exact filenames:

- `ultimate-sop-framework.pdf`
- `business-systems-guide.pdf`
- `partnership-blueprint.pdf`
- `faith-blueprint.pdf`
- `revenue-playbook.pdf`

These files are referenced by both:
- the static site front-end
- the Cloudflare Worker lead bridge in `workers/ghl-leads/`

## Temporary behavior
If a PDF is missing, the front-end will still submit the lead, but the download link will fail unless you add the file or point the page to a different URL.

## Recommendation
Use real final PDFs here before going live.
