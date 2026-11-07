# SEO weekly execution — November 7, 2026

## GSC baseline

Latest complete Search Console data available on November 7 still ends on November 4. The report covers October 20 through November 4 and shows 122 clicks, 4,169 impressions, 2.9% CTR, and average position 7.8.

| Page | Clicks | Impressions | CTR | This release |
| --- | ---: | ---: | ---: | --- |
| `/guide/prompt/` | 35 | 762 | 4.6% | Frozen except for one contextual link to the non-brand landing page |
| `/comfyui/mossimagehfloader/` | 26 | 143 | 18.2% | Frozen |
| `/guide/local-deploy/` | 6 | 287 | 2.1% | Search snippet and first decision block revised |
| `/workflows/` | 4 | 163 | 2.5% | Two-download selector added |
| `/comfyui/` | 3 | 195 | 1.5% | Replaced generic article with a dedicated decision hub |
| `/text-in-image-generator/` | 0 | 11 | 0% | Above-the-fold generator CTA and three contextual links added |

The legacy `/guide/base-vs-sft/` redirect, `/comfyui/mossimagehfloader/`, and HTTP-to-HTTPS behavior were intentionally not changed. The current repository and exported site contain no `http://mossimage.run` business links; the sitemap and canonicals remain HTTPS.

## Implemented scope

- `/guide/local-deploy/`: Title and description now match install intent. The first section accurately distinguishes separate native model components from a complete Diffusers directory and avoids universal VRAM claims.
- `/comfyui/`: A dedicated static page now routes users to native setup, MOSSImageHFLoader help, matching downloads, and settings without duplicating the full installation guide.
- `/workflows/`: The first content block names the only two downloadable files, their loaders, and their checkpoints.
- `/text-in-image-generator/`: A direct studio CTA appears before the examples. Contextual links now come from the homepage, Chinese text guide, and prompt guide.
- Sitemap content dates and visible/structured modification dates were advanced to November 7 for materially changed pages.

## Validation completed

- All 40 automated tests pass.
- Web and Worker TypeScript checks pass.
- Next.js static export succeeds for all 55 generated pages.
- The content-date consistency check and `git diff --check` pass.
- Exported HTML has the expected Title, description, canonical, H1, update dates, and contextual links.
- Exported files contain no `http://mossimage.run` reference.
- Desktop and 390 × 844 mobile checks confirm the ComfyUI decision table follows the introduction and the text-in-image CTA is visible above the examples.

## Measurement rules

Freeze the changed search copy for at least 14 days. Compare complete post-release data instead of mixing pre-release days into the evaluation window.

- Local Deploy: evaluate after at least 200 new impressions; target 3.2–3.5% CTR or a 50% relative lift.
- ComfyUI: evaluate after at least 150 new impressions; target 2.5–3.0% CTR.
- Workflows: evaluate after at least 150 new HTTPS impressions; target at least 3.5% CTR.
- Text-in-image: use 30–50 impressions after 14 days as initial traction and 100 as a 28-day goal.
- Legacy Base/SFT and HTTP URLs: judge the direction of new seven-day impressions, not whether the rolling 28-day history instantly reaches zero.

Do not purchase backlinks during this measurement window. Reconsider only after the non-brand page reaches 100–200 impressions and its target queries stabilize between positions 6 and 15.
