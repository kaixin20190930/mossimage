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

## November 19 follow-up release

The November 4–10 (72 clicks / 1,880 impressions) and November 11–17 (46 / 1,620) comparisons are user-supplied, not independently re-fetched in this release. Average positions and a single SERP snapshot do not establish the cause of the decline. The requested “301 not done” claim was contradicted by production: `/guide/base-vs-sft/` already permanently redirects (308) to `/compare/base-vs-sft/`. Preserve that existing consolidation and its internal links rather than reverse it.

Implemented scope:

- Keep the prompt title and builder; add focused revision tips and an official-enhancer explanation. Add contextual, varied-anchor backlinks from settings, turbo, examples, and presets. Do not create redundant near-identical H2 sections just to repeat keywords.
- Permanently redirect the JSON blog article, with and without trailing slash, to `/guide/json-layout/` using 301 and preserving query strings. Retain product and bilingual copyable examples on the destination. Point discovery links directly to the guide and remove the old article from sitemap. Keep `/json-layout/` a visual bbox editor.
- Add original-versus-HQ selection and exact v5 format/folder/conditioning mapping to the edit guide. Follow the current model-card recommendation, not a larger version number; do not claim measured quality superiority.
- Publish `/guide/prompt-enhancer/` and `/guide/lora-training/`, with source links, guide-index entries, sitemap entries, and contextual discovery links. The rewrite example is explicitly illustrative; no image generation or training benchmark is claimed. Explain cached/offloaded 6 GB training, architecture-specific precision, and untested Arc support.
- No generator, billing, provider, training service, new client interaction, 2K page, or portrait page changes. Turbo recipes and Base/SFT destination remain unchanged.
- Build prerequisite: patch Next.js 16.4.2 to 16.4.5 for GHSA-mfr8-8qww-v76h and GHSA-vc7v-qv4w-wrv8. The project does not use the affected cache APIs and deploys static assets, but its build security check blocks the old dependency. No framework-major upgrade or cache redesign.

Observation plan (GSC report dates, not converted Beijing calendar days): freeze the content until one complete post-release week exists. Use November 20–26 as the first full seven-day window; review on November 29 Beijing time, only if complete data through November 26 is available. If not, defer the comparison. Compare November 13–19 for the adjacent baseline, explicitly marking the release day as mixed; retain November 11–17 only as historical context, not the adjacent control.

| Metric | Scope and decision rule |
| --- | --- |
| Prompt clicks | Exact `/guide/prompt/` page filter, all queries; aspirational seven-day target ≥30. Also show impressions, CTR and impression-weighted query positions for the three specified guide variants. |
| JSON family | Fixed case-insensitive query filter `json.*(bbox|layout)|(bbox|layout).*json`; page breakdown across former blog, guide, and tool. Target ≥100 guide impressions per complete week, but do not add page-impressions and call them unique searches. Tool-intent impressions remain valid on `/json-layout/`; they need not migrate. |
| Edit traction | Exact `/moss-image-edit/`, first post-release click, impressions and query breakdown. Zero clicks with very few impressions is inconclusive. |
| New-page discovery | Each new URL separately: impressions and first impression date; if none, inspect index status, last crawl, selected canonical and internal discovery before suggesting another content change. |

Treat all numbers as targets, not promised outcomes. Historical redirected-URL impressions need not instantly vanish. This release does not create or change a scheduled automation; the dates above are the measurement protocol, not a claim that a reminder was scheduled.
