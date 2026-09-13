# Maintaining the collection

Use short, repeatable curation sessions. A useful addition or correction matters
more than hitting a fixed quota. The catalog remains the source of truth.

## Twice-weekly pass

1. Check the working tree and review unresolved contributor issues. Preserve
   unrelated edits. Compare both showcase and prompt/reply URLs with existing
   entries before drafting a new case.
2. Review recent primary creator posts. Use other galleries only to discover
   links. Prioritize explicit GPT Image 2.5 evidence and useful gaps identified in
   CURATION.md. Engagement does not determine admission or quality. Source posts may use any language; do not
   require bilingual posts.
3. Open the primary post and any author reply containing the full instructions.
   Verify the model claim, actual prompt, reference requirements, and result.
   Record conflicting model labels in a candidate note until resolved.
4. Add distinct qualifying cases without a numeric target. Different briefs in one
   thread can be separate entries, but preserve their individual post URLs and
   metrics. Never multiply a thread's total engagement across its replies.
5. Write all configured language versions under `data/prompts/`. Label condensation as adaptation;
   keep original wording, translations, source images, and independent outputs
   separate. Missing metrics remain null.
6. Run `npm run build` and `npm run check`. Review all generated language galleries, especially
   same-case language anchors, evidence, precise CTAs and images inside collapsed exploration.
7. Apply the 50-source batch stopping rule in CURATION.md after covering the task
   matrix and author paths. Record blocked sources and incomplete batches; do not
   mistake a few empty web queries for exhaustive X coverage.
8. Prepare a small review package containing the diff, source URLs, validation,
   and publication-ready copy. A local passing check is not a public release.

## Weekly review

Record the published revision separately from the local candidate count. Save a
GitHub traffic snapshot with `npm run metrics:snapshot` to a local file, for example:

```bash
mkdir -p .local/operations
npm run --silent metrics:snapshot > .local/operations/github-traffic.json
```

This command requires the GitHub CLI and repository access for traffic data. It
only reads GitHub and writes JSON to stdout. Each unavailable dataset stays null
with an explicit status. Do not add these private analytics files to the public
repository. Preserve dated snapshots instead of overwriting the sole copy.

Compare repository visitors, stars, website referrals, and actual product use
when those data are available. GitHub traffic is a rolling window: do not add
overlapping windows together or interpret every repository view as a new user.
Treat click/usage observations as exploratory until there is enough traffic.

Prepare one weekly selection explaining what the cases help people do. Include
author links and a complete Chinese translation of English public copy. Publish
only within the user's current authorization; automation does not grant it.

## Reproduction and maintenance

- Reproduce selected cases only with an authorized model account and spending
  allowance. Record the provider, exact model ID/variant, parameters, prompt,
  input provenance, timestamp, actual cost, and output before changing test status.
- A generic image-generation tool is not proof that GPT Image 2.5 was tested.
- Review counts, text accuracy, composition, and reference preservation against
  the actual brief. Keep imperfect results and describe their limits honestly.
- Check broken sources and previews monthly. Keep unresolved cases out of the
  published catalog rather than inventing a replacement source.
- Keep website integration and content updates separate. Change the shared
  destination only after the target page is publicly available and verified.

See [curation](CURATION.md), [data format](DATA_FORMAT.md), and
[content policy](../CONTENT_POLICY.md).
