# Curation and evidence

Admission comes first, editorial quality second, placement last. Engagement is
useful discovery evidence; it never decides quality order. There is no case quota.

## Admission

Open the primary source, including the author's prompt reply where applicable.
Require explicit GPT Image 2.5 attribution, a reusable prompt or workflow, its
corresponding result, input requirements and a rights statement. Preserve source
wording separately from translations and disclosed editor adaptations. Never
infer an alleged original prompt from an image or rename an older-model result.
An adaptation's source preview is not proof that the adapted wording reproduces it.

Official documentation can be a primary source. Keep its input images in
`references`, outputs in `previews`, source settings in notes and all unavailable
social metrics null. Each distinct recipe needs its own paired evidence.
Shared article engagement must not be multiplied across cases.

## Editorial quality, version 1

Rate each dimension from 0 to 4: no evidence, weak, usable, solid, excellent.
The score is an editorial assessment of the documented recipe and visible source
result, **not a model benchmark or independent reproduction score**.

| Dimension | Weight | Review question |
| --- | ---: | --- |
| `reuse` | 30% | Are the inputs, steps and tools sufficient to try the workflow? |
| `result` | 25% | Does the visible result meet composition, text and key constraints? |
| `usefulness` | 20% | Is there a practical use or a clear learning objective? |
| `clarity` | 15% | Are instructions understandable and internally consistent? |
| `distinctiveness` | 10% | Does the recipe teach a distinct control method? |

`quality_score = sum(rating × weight / 4)`. Store only ratings, review date,
version and a case-specific rationale in `curation`. The build derives the score,
featured eligibility and placement. Do not award points for length, likes or fame.
A short, well-grounded local edit can be more useful than a long adjective list.
Invisible details are unknown; preview inspection cannot prove alpha correctness,
engineering accuracy, editable vector output or temporal consistency.

- At least 80: eligible for featured selection if in the main gallery.
- 65–79: ordinary gallery.
- Below 65: publish only with a stated learning objective (`educational: true`),
  in the collapsed exploration section; otherwise hold.
- Order by descending quality, then stable ID. No heat-based tie breaker.
- Select up to six featured links, at most one per category and two per author.
  Show fewer if the constraints cannot be satisfied; never relax them to fill space.

## Content placement

Non-explicit adult suggestive material may be retained with `suggestive`, but
its image and prompt default to collapsed exploration and it is never featured.
Ordinary fashion or swimwear does not automatically receive this flag. Evaluate
the actual presentation and prompt. Use `horror` for disturbing imagery.

Sexualized depictions with unclear adult age stay on hold. Pornography,
sexualization of minors and non-consensual intimate content are not admitted.
See [content policy](../CONTENT_POLICY.md). Hold decisions remove the case from
public gallery content and `catalog.entries`; `catalog.withheld` and a stable
explanation page preserve the ID without displaying the image or recipe.
A later review may change the decision when the actual evidence changes.

## Source, language and testing

`source-checked` means the primary source was opened. It does not mean the
maintainer ran the model. `independently_tested` requires a real authorized run
with recorded model, inputs, settings and public output evidence. Do not turn an
official or creator example into a maintainer test.

The post language and original prompt language can differ. Keep both. Preserve
numbers, exclusions, variable names, step order and literal text intended for the
image in every translation. Translation review hashes detect changed text; they
are not a claim of native-speaker review or proof of semantic equivalence.

## Discovery and stopping

Review existing cases before searching for more. Then check official guides,
low-engagement local candidates, recent work by known authors and primary links
in useful collections. Prioritize gaps in product advertising, typography,
infographics, precise editing and sketch control. Compare the actual technique;
recolors, translations and repeated promotional posts are not new recipes.

Use a discovery matrix spanning products, typography/information design, local
editing, architecture/spaces and brand/creative assets. Search English, Chinese
and Japanese first, then check Korean, Spanish and Portuguese sources. Combine
model-name variants with task terms, and inspect both Latest and Top results.
Do not require minimum likes or the word “prompt”: instructions may be in an
author reply or article. Follow relevant authors and resolve mixed-model threads.

Deduplicate post IDs before review, then compare the task, input roles and control
method. Different cities, colors, translated copies or repeated campaign posts
usually belong to one recipe. A larger collection is a discovery index, not an
admission authority. Public embed responses can truncate long posts; open the
full original before preserving prompt wording. Missing evidence stays unknown.

Log queries, time windows, unique sources, decisions and exclusion reasons. Review
new sources in batches of 50. After the main task and author paths are covered,
stop an active search session when two consecutive full batches each yield fewer
than five admissible distinct recipes and no high-value lead remains unresolved.
Record any unfinished batch and inaccessible source separately. This is an
editorial cost rule, not proof that X or the web has been exhausted.

Roughly 80–120 published cases is a useful next coverage checkpoint, not a quota,
minimum release size or upper limit. Publish fewer when evidence is insufficient;
continue beyond it when new recipes add value. Prioritize filling task gaps before
translating all candidates. Nine complete languages, accurate provenance and
passing checks are required before a new case counts as published catalog content.

The derived `discovery_score` is a weighted mean of `log(1 + count)` using likes
0.35, bookmarks 0.35, reposts 0.20 and views 0.10. Missing metrics are excluded
and weights renormalized; all missing yields null. Replies are recorded only.
Dates belong to individual observations, not a misleading shared freshness label.
