# Wedding Photo Gallery

A low-cost wedding photo sharing site. The frontend runs on GitHub Pages, while uploads and gallery data are handled by Cloudflare Worker, R2, and D1.

## Features

- Guest photo uploads without login.
- Optional uploader name.
- Public gallery for anyone with the link.
- Lightbox preview and individual downloads.
- Admin token controls for hide/delete.
- Cloudflare R2 photo storage with D1 metadata.
- GitHub Pages deployment workflow.
- Single wedding today, event-based model for future platform support.

## Cost Shape

- GitHub Pages: `$0/month`.
- Cloudflare Workers, D1, and R2: usually `$0-$1/month` for a normal wedding.
- Workers Paid is optional at about `$5/month` if traffic exceeds the free tier.

## Local Setup

```bash
npm install
npm test
npm run dev
```

Create a `.env.local` file for frontend development:

```bash
VITE_API_BASE_URL=http://localhost:8787
VITE_EVENT_SLUG=wedding
VITE_EVENT_TITLE=Wedding Photo Gallery
```

Run the Worker locally:

```bash
cp wrangler.toml.example wrangler.toml
npm run worker:dev
```

## Cloudflare Setup

1. Create an R2 bucket named `wedding-photo-gallery`.
2. Create a D1 database named `wedding-photo-gallery`.
3. Copy `wrangler.toml.example` to `wrangler.toml`.
4. Replace `database_id` in `wrangler.toml` with your D1 database ID.
5. Set the admin token secret:

```bash
npx wrangler secret put ADMIN_TOKEN
```

6. Apply the D1 migration:

```bash
npm run db:migrate:remote
```

7. Deploy the Worker:

```bash
npm run worker:deploy
```

After deployment, copy the Worker URL, usually like:

```text
https://wedding-photo-gallery-api.<your-subdomain>.workers.dev
```

## GitHub Pages Setup

In the GitHub repo, go to **Settings -> Secrets and variables -> Actions -> Variables** and add:

- `VITE_API_BASE_URL`: your Worker URL
- `VITE_EVENT_SLUG`: `wedding`
- `VITE_EVENT_TITLE`: the display title for the gallery

Then enable Pages with **Settings -> Pages -> Build and deployment -> GitHub Actions**.

## Deployment

Push to `main`. The GitHub Actions workflow builds the Vite app and deploys `dist/` to GitHub Pages.

## Notes

- Guests do not need a Google, GitHub, or Cloudflare account.
- Google Drive can be added later as an admin export/backup destination.
- `wrangler.toml` is ignored because it contains account-specific Cloudflare IDs.
