# Prompt guide SEO closeout — November 7, 2026

Scope: `/guide/prompt/`, its sitemap date, and three existing incoming links. The page Title and shared metadata definitions are unchanged. No production deployment was performed.

## Dates

The existing structured-data publication date, October 23, 2026, is retained as the original publication date. The conflicting visible October 26 publication label now uses that same source. The previous October 31 modification date advances to November 7 for the new substantive content. The visible update label and structured-data modification date use the same content-date registry as sitemap. Historical example-generation and source-check dates are unchanged.

## Useful content and anchor allocation

The new `#refine` section diagnoses spelling, crowding, and placement failures; rewrites a vague bilingual poster request; and explains a controlled revision process. Its copyable prompt is explicitly an untested writing draft. No paid generation was requested.

| Existing source | Search intent | Anchor and destination |
| --- | --- | --- |
| Chinese image generator | prompting tips | MOSS-Image prompting tips for bilingual text → `/guide/prompt/` |
| Prompt examples article | prompt builder | Open the MOSS Image prompt builder → `/guide/prompt/#builder` |
| Text in image generator | prompt examples | MOSS Image prompt examples for text in images → `/guide/prompt/#proven` |

These are contextual allocations, not claims about measured query volume. Global navigation was not changed.

## Validation

- `npm run build` passed, including Next.js TypeScript validation and static export.
- Targeted checks on exported HTML passed: exact unchanged Title, canonical, JSON-LD publication/modification dates, visible dates, this route's sitemap entry, new section and directory anchor, internal destination existence, and the three incoming anchors.
- `git diff --check` passed. No full-site SEO audit or unrelated Worker tests were run.
- Browser rendering and live GSC data could not be checked: site access to the existing analytics tab was explicitly denied by the browser permission gate. This does not establish whether the administrator is signed in. Local code confirms the analytics report requires an administrator session.

## Manual GSC readings still needed

Using the authorized `support@mossimage.run` administrator session, read the `sc-domain:mossimage.run` property:

1. Filter performance to exact page `https://mossimage.run/guide/prompt/`. Record latest complete 28 days and preceding 28 days: clicks, impressions, CTR, and average position.
2. Export this page's queries and compare `moss image prompt`, `moss-image prompt`, `moss image prompting`, `moss image prompt builder`, and prompt-example variants. Record actual query strings and metrics; avoid interpreting missing rows as zero demand.
3. Use URL Inspection to record indexing status, last crawl, user-declared canonical, and Google-selected canonical.
4. Read sitemap processing status and whether the page is discovered through sitemap. After deployment and recrawl, confirm the updated HTML/date values.

## Release gate

Commit and push these changes before any production release. The repository's Wrangler build hook must pass with a clean tree and local HEAD exactly matching its fetched upstream. Production release remains `npm run deploy:production`, which runs tests, typecheck, build, and Wrangler deployment. This closeout's targeted checks do not substitute for that release sequence. No direct Wrangler deployment was attempted.
