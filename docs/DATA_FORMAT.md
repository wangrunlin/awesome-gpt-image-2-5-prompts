# Data contract — version 2

`data/prompts/*.json`, `data/site.json` and `data/locales.json` are the source of
truth. `npm run build` generates all nine README galleries, `prompts/*.md` and
`data/catalog.json`. Use Node.js 22+. No runtime packages or paid services are
needed. `npm run check` validates data, runs tests and checks generated consistency.

This is a one-time structure change. There is no legacy reader, dual writing or
compatibility switch. Schema version appears **only at the catalog root**.

## One multilingual body

```js
entry.title.en;
entry.title['zh-CN'];
entry.summary.ja;
entry.prompt.steps[0]['pt-BR'];
entry.inputs[0].fr;
entry.notes[0].de;
```

Every text object contains exactly the configured nine locale codes: `en`,
`zh-CN`, `zh-TW`, `ja`, `ko`, `fr`, `de`, `es`, `pt-BR`. There is no `zh` alias,
`localizations` body or language-specific renderer. Category names use the same
codes in `site.categories`. Source files and exported entries share the same
body; the build does not project or duplicate translations.

`prompt.original_steps` is the archived wording, separate from editable localized
steps even when text is identical. Historical adaptations without archived source
wording use null. `prompt.kind` is `original`, `translation` or `adaptation`.
`prompt.original_language` and `source.post_language` are independent canonical
BCP 47 codes, or null if unknown. A source language code such as `zh` remains a
valid provenance value; it is not a supported text-object key.

`prompt.preserved_literals` optionally lists exact text or variables that must
occur in the archived source and every localized recipe. Do not translate image
copy merely because the instructional language changes.

`translation_meta` stores one shared `source_digest` and `text_digests[locale]`
for the eight translated bodies. It contains no text and does not repeat the
same source hash eight times. The source digest covers English editorial text,
archived source, source language, reference inputs and any held-case notice.
Each text digest covers that locale's title, summary, steps, inputs, notes and
notice. Changes invalidate review; the nine-language release is reviewed as one
complete set, with no partial-translation compatibility mode.

Review the text before refreshing these hashes with `sourceDigest` and
`translationDigest` from `scripts/catalog.mjs`. Build never refreshes them.
The hashes detect changes; they do not prove translation quality.

## Provenance and review

Keep model attribution (`model.family`, `variant`, `evidence_url`, `evidence`)
separate from `verification.independently_tested` and `test_url`. The latter
requires actual test evidence. Source media has URL, credit, source URL and
`kind: "source-result"`. Optional `references` has URL, credit and source URL in
input order; instructions in `inputs` explain its role. External GIF assembly,
layout composition or file export tools must be stated explicitly.

`curation` stores version 1, `reviewed_at`, `decision` (`publish` or `hold`), five
0–4 ratings, a concise `rationale`, `educational` and `content_flags` (currently
`suggestive`, `horror`). Held cases also require a nine-language `notice` explaining the decision. Ratings and rules are in [CURATION.md](CURATION.md).
Do not store source-level `featured`, `quality_score` or `placement`.

Engagement values are nonnegative integers or null. Keep the exact measured
source, observation method and date; a fresh editorial review must not silently
refresh old metric or source-check dates. `source.section` may identify an
article's subcase. `source_checked_through` is the latest individual check date,
not evidence that every case was checked on that date.

## Export

```js
catalog.schema_version === 2;
catalog.entries;      // published cases, descending quality then stable ID
catalog.featured_ids; // up to six diverse first-screen selections
catalog.withheld;     // [{ id, reason }], never import as active prompts
```

Each exported entry adds `quality_score`, `discovery_score`, `featured`
(eligibility), `placement` (`main` or `explore`) and `website_url` (verified clean
detail URL or null). `featured` is not the same as membership in `featured_ids`.
No held prompt body is included. Display flags are mandatory consumer behavior;
do not let random recommendation mixing promote an exploration case.

## Links and website import

`site.url` is the maintainer homepage; `site.promptDestination` is the live
[online gallery](https://image-2-5.com/gpt-image-2-5-prompts).
`site.promptPages[id]` stores a verified `/prompt/community-<id>` URL and check
date. Only add it after checking the actual live page and matching title. Pending
cases use a gallery CTA, never a guessed detail URL.

`websiteLink` adds `utm_source=github`, `utm_medium=referral`, campaign
`awesome-gpt-image-2-5-prompts`, and `utm_content=<position>--<locale>--<id>`.
Global links omit ID. Author and evidence URLs receive no marketing parameters.
Each case has one site CTA inside its prompt disclosure. README has one maintainer
homepage link and two gallery entrances (banner and text). Standalone case pages
contain both English and Chinese recipes plus same-case links to all languages.

Language links use GitHub's `user-content-case-<id>` anchor. The renderer emits
that alias for local previews too. Stable IDs also underpin website paths and
analytics; changing them is not data cleanup.

Website builds import a pinned catalog revision, not live GitHub raw data. Reject
unsupported schemas explicitly. Keep the website's compact search index and
per-case lazy-loaded files; those are runtime requirements, not legacy fields.
Import active entries, remove/disable withheld IDs and apply placement rules
before recommendation mixing. The website has its own deployment and tests;
updating this repository does not update the live gallery.
