# Joshua Nwachinemere | Portfolio

A fast, responsive portfolio for Joshua Nwachinemere, an AI Engineer building Python systems for retrieval, context engineering, multimodal and voice applications, model integrations, backend services, and ML evaluation workflows.

## Run locally

```bash
npm ci
npm run dev
```

## Verify and build

```bash
npm run check
```

The production files are generated in `dist/`.

### Regenerate the CV artifacts

```bash
python scripts/build_cv.py
```

DOCX and PDF generation is byte-reproducible by default. Set `SOURCE_DATE_EPOCH` only when an intentional release timestamp is required; otherwise the generator uses the documented fixed source date encoded in `scripts/build_cv.py`.

## Content principles

- Project claims are based on Joshua's original public repositories.
- The site avoids unsupported customer, scale, and performance claims.
- The visual identity is face-free and uses a terminal/workflow motif.
- Contact: `joshua0nwachinemere@gmail.com`

## Deployment

The project is a static Vite site. It is ready for a root-domain deployment on Cloudflare Pages, Netlify, Vercel, or another static host. A GitHub Pages project-site deployment needs an explicit Vite `base` path first. Publishing, production metadata, and host-level security headers remain separate release steps that require approval.

### Custom domain

Every canonical URL, `og:url`, `og:image`, `twitter:image`, sitemap entry, robots directive and the assistant's citation base comes from one build-time switch:

```sh
SITE_ORIGIN=https://joshuanwachinemere.dev npm run build
```

Without `SITE_ORIGIN` the build keeps the `https://joshua-nwachinemere.pages.dev` origin, so local builds, previews and tests are unaffected.

**Current state:** the production Pages environment sets `SITE_ORIGIN=https://joshuanwachinemere.dev`, so every deploy of `main` publishes the domain in the canonical, `og:url`, `og:image`, sitemap, robots and assistant citations. `joshuanwachinemere.dev` and `www.joshuanwachinemere.dev` are attached to the project, proxied to `joshua-nwachinemere.pages.dev`, with an active Cloudflare certificate. The `pages.dev` host still serves the same deployment as a fallback, and `dk3yyyy/joshua-portfolio` on GitHub Pages redirects to the domain.

To attach a different domain later:

1. Add the hostname under **Workers & Pages → `joshua-nwachinemere` → Custom domains** and let Cloudflare create the `CNAME` record.
2. Set `SITE_ORIGIN=<new origin>` in the Pages production environment variables.
3. Push any commit to `main` (the deploy retry endpoint is not available), then confirm `/`, `/privacy`, `/sitemap.xml` and the current `og-card` all return 200 on the new host.
4. The social card has the host printed on it. Regenerate it with `SITE_ORIGIN=<new origin> npm run build:assets`, save the result under a new filename, and update the `og:image`/`twitter:image` references plus the site tests — the filename bump is what busts cached previews.

