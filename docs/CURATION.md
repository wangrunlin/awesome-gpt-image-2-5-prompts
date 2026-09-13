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

Record considered sources and exclusions. Stop a session after two consecutive
search rounds produce no new admissible distinct recipe. An inaccessible or
incomplete source remains a candidate, not a published case. Nine complete
languages, provenance and passing checks are required before an addition counts.

The derived `discovery_score` is a weighted mean of `log(1 + count)` using likes
0.35, bookmarks 0.35, reposts 0.20 and views 0.10. Missing metrics are excluded
and weights renormalized; all missing yields null. Replies are recorded only.
Dates belong to individual observations, not a misleading shared freshness label.
