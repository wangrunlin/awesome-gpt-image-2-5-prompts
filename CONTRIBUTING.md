# Contributing

Help make this a useful, well-attributed GPT Image 2.5 prompt collection.
The project is maintained by [Image 2.5](https://image-2-5.com).

## Suggest a prompt without writing code

Use the [prompt submission form](https://github.com/wangrunlin/awesome-gpt-image-2-5-prompts/issues/new?template=prompt.yml).
Send the original post, creator, complete prompt or clearly labeled adaptation,
reference requirements, and a result example. A prompt in the author's reply
needs its own URL as well as the showcase post's URL.

We prioritize source-backed GPT Image 2.5 cases with strong observed interest, in any source language. Low-engagement leads may remain in the local candidate queue. A large like count cannot substitute
for an actual prompt. Pure announcements and showcases without a reusable
workflow belong in research, not the published catalog.

## Add an entry with a pull request

1. Fork and clone the repository. Use Node.js 22 or later; no packages are needed.
2. Add one stable, lowercase kebab-case file in `data/prompts/`. Start with a
   similar existing entry and follow [the data contract](docs/DATA_FORMAT.md).
3. Keep original wording, translation, and adaptation labels accurate. Provide
   complete titles, summaries, steps, and notes for every language configured in data/locales.json. Preserve the original prompt and record post/prompt languages separately.
4. Include primary source links, model evidence, reference requirements, source
   result previews, and a dated public metric snapshot where available.
5. Run `npm run build`, then `npm run check`.
6. Include the generated README files, catalog, and prompt pages in the PR.

Never edit generated files by hand. Never insert product URLs or marketing copy
into a creator's prompt. Project CTAs come from `data/site.json`; changing the
future website destination should require one configuration edit.

For independent tests, use your own or authorized inputs and include the actual
model ID, parameters, date, prompt version, and output. Do not mark a source's
claim as an independent test. Do not commit credentials, private conversations,
or account screenshots.

## Commit and pull-request titles

Use English [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```text
feat(prompts): add a reference-guided product photo workflow
fix(prompts): correct the source author for a portrait
docs: clarify reference image requirements
chore(data): refresh dated engagement snapshots
```

Keep changes focused. Prefer one new case or one coherent batch per PR. Avoid
renaming stable IDs. Describe what changed, cite its source, and list checks.
Maintainers use squash merging and preserve contributor attribution.

## License and conduct

Contribute only material you can share, and follow [CONTENT_POLICY.md](CONTENT_POLICY.md).
Your original tooling and documentation contributions use this project's MIT
license; third-party materials retain their original terms. Be respectful,
specific, and helpful in issues and reviews. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
