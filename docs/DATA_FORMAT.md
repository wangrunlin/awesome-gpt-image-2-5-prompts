# Data contract

The catalog is designed to power the future prompt library on
[Image 2.5](https://image-2-5.com) without a second content database.
Schema version: **1**. UTF-8 JSON, LF newlines, two-space indentation.

## Authoritative files

- `data/prompts/<stable-id>.json`: one case, including its bilingual prompt and evidence.
- `data/site.json`: categories, repository, brand, contact, and shared destination URL.
- `data/catalog.json`, `README*.md`, and `prompts/*.md`: generated; do not edit manually.

Use Node.js 22+ and run `npm run build` after every data edit. `npm run check`
validates content, tests important rejection paths, checks local Markdown links,
and rejects stale generated files. There are no package dependencies.

## Entry fields

| Field | Meaning |
| --- | --- |
| `schema_version` | Integer `1`; increase for a breaking consumer contract change. |
| `id` | Stable lowercase kebab-case ID; must match the filename. |
| `title`, `summary` | Objects with nonempty `en` and `zh` text. |
| `category` | ID from `data/site.json`. |
| `tags` | Search/filter labels in lowercase kebab-case. |
| `mode` | `generate`, `edit`, or `workflow`. |
| `featured` | Editorial placement; not a quality certification. |
| `model.family` | GPT Image 2.5. |
| `model.variant` | `flare`, `sunburst`, or `null` when the source does not specify. |
| `model.evidence_url`, `model.evidence` | Primary statement supporting the model attribution; not independently verified model metadata. |
| `prompt.kind` | `original`, `translation`, or `adaptation`. The launch collection has original English prompts and editorial adaptations. |
| `prompt.original_language` | `en` for original English blocks; otherwise `null` unless a translated original language is documented. |
| `prompt.steps` | Ordered `{en, zh}` prompt blocks. Each block is independently copyable. |
| `inputs`, `notes` | Arrays of `{en, zh}` requirements and provenance/usage notes. |
| `source` | Platform, creator handle, showcase URL, prompt/reply URL, UTC check time, status, and observed disclosure. |
| `previews` | Externally linked creator results with credit, source URL, and explicit `source-result` kind. |
| `engagement` | Likes, reposts, replies, bookmarks, views, UTC observation time, method, and the exact measured post URL. |
| `verification` | Independent test status and public evidence URL; all launch cases are untested by this repository. |
| `rights` | Third-party material retains its own terms; MIT does not cover everything in the catalog. |

Metrics use nonnegative integers or **`null` for unavailable**. Never replace a
missing count with zero. Metrics refer to the main showcase post, even when the
prompt is in a separate reply. Do not use a quoted post's date or counts.

## Website integration

```js
const catalog = await fetch('/data/catalog.json').then(response => response.json());
const portraits = catalog.entries.filter(entry =>
  entry.category === 'photography' && entry.mode === 'generate'
);
const firstPrompt = portraits[0].prompt.steps[0].en;
```

Serve the file from your own build or a pinned GitHub revision. GitHub's raw-file
endpoint is not a promised application API. Cache imports and keep stable IDs so
saved links survive updates. No API key belongs in this repository.

Future pages can filter by category, tags, reference requirements, prompt kind,
and independently tested status. Keep the original-source links and observation
times visible. Label source previews separately from your own generated outputs.

Set `data/site.json` → `promptDestination` to the future prompt page and rebuild.
Today it is the homepage. No route, copy button, prompt-prefill parameter, or
generation API integration is claimed to exist by this repository.
