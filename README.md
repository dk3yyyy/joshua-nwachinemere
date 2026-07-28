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
- Contact: `josh0victor@outlook.com`

## Deployment

The project is a static Vite site. It is ready for a root-domain deployment on Cloudflare Pages, Netlify, Vercel, or another static host. A GitHub Pages project-site deployment needs an explicit Vite `base` path first. Publishing, production metadata, and host-level security headers remain separate release steps that require approval.
