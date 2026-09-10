# Zafar

A study library for Malawian secondary students: MANEB MSCE/JCE past papers,
mocks, textbooks, summary notes and marking keys.

## Layout

```
web/                     static frontend (no build step, no framework)
  index.html             marketing landing page
  login.html             sign in
  register.html          create account
  home.html              signed-in dashboard overview
  dashboard.html         past papers
  books.html             textbooks
  notes.html             summary notes
  marking-keys.html      marking keys
  favorites.html         saved documents, across every section
  help.html              FAQ
  assets/css/app.css     the whole design system, token driven, light + dark
  assets/js/config.js    API client, token storage, favorites, formatting
  assets/js/shell.js     sidebar + topbar + theme + drawer + toasts
  assets/js/list.js      the shared document-list page
  assets/js/home.js      dashboard overview
  assets/js/demo.js      offline demo catalogue (fallback when the API is down)
server.js                zero-dependency static server for local development
worker.js                Cloudflare Worker that signs + streams Drive downloads
```

The sidebar and topbar are rendered once from `shell.js`, and every list page
(papers, books, notes, marking keys, favorites) is one call to
`ZafarList.init({...})` — so a change to a card or a filter lands everywhere.

## Running locally

```bash
node server.js            # http://localhost:4173
```

Or with the Alloy dev stack:

```bash
docker compose -f docker-compose.alloy.yaml up
```

## Backend

`API_BASE_URL` in `web/assets/js/config.js` points at the deployed FastAPI
backend. Endpoints used:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | create an account (JSON) |
| POST | `/auth/login` | issue a JWT (form-encoded, OAuth2PasswordRequestForm) |
| GET | `/auth/quota` | today's remaining paper/book downloads |
| GET | `/drive/papers` | catalogue, filtered by `section`, `category`, `q` |
| POST | `/drive/download/{id}` | spend quota, return a short-lived signed URL |
| POST | `/drive/confirm/{download_id}` | confirm the bytes actually arrived |

Override the backend per-session with `?api=https://…` on any page.

When the backend can't be reached, the client transparently falls back to the
bundled demo catalogue and every page shows a **Demo data** badge, so the UI is
always explorable. `?demo=1` (or the landing page's "Explore the demo" button)
forces that mode on.

## Downloads

The catalogue response never carries a file URL — a permanent link there would
let the daily quota be bypassed from the network tab. Each click calls
`POST /drive/download/{id}`, which enforces the quota and returns a signed,
expiring URL for `worker.js`. The Worker verifies the HMAC and streams the file
from Drive with a correct `Content-Disposition`; the page then hands the browser
a same-origin blob so the filename survives.
