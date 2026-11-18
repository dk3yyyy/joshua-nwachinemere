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

Without `SITE_ORIGIN` the build keeps the `https://joshua-nwachinemere.pages.dev` origin, so local builds, previews and tests are unaffected. To publish on the domain:

1. Add `joshuanwachinemere.dev` as a custom domain on the Cloudflare Pages project (`joshua-nwachinemere`) and let Cloudflare create the `CNAME`/A records.
2. Set `SITE_ORIGIN=https://joshuanwachinemere.dev` in the Pages project's production environment variables.
3. Redeploy `main`, then confirm `https://joshuanwachinemere.dev/`, `/privacy`, `/sitemap.xml` and `/og-card-v10.png` all return 200.
4. Keep the old `pages.dev` host serving; it becomes a duplicate origin, not a broken link. The `dk3yyyy/joshua-portfolio` GitHub Pages stub should then point at the new domain instead of `pages.dev`.
5. The social card has the host printed on it. Regenerate it with `SITE_ORIGIN=https://joshuanwachinemere.dev npm run build:assets`, save the result as `public/og-card-v10.png`, and update the `og:image`/`twitter:image` references plus the site tests — the filename bump is what busts cached previews.

