# Design QA — Signal Rush runner revision

Source visual truth:
- `/workspace/scratch/cde83fd874fe/upload/81a52884-5a2c-477f-9870-e442c53691f2.png` (535 × 477 px)
- `/workspace/scratch/cde83fd874fe/upload/70cbf618-7e23-4230-8d99-36dfee4940dd.png` (320 × 708 px)

Implementation screenshot:
- Cloud Browser inline capture from `http://terminal.local:4173/` (the browser runtime did not expose a shared local screenshot path)
- Viewport: 1363 × 936 CSS px
- Device pixel ratio: 1
- State: Chapter 2, hazard choice approaching, three lanes visible before collision

## Full-view comparison evidence

The references and implementation were opened in the same comparison pass. The implementation now carries the source composition cues that matter to this product: a high rear camera, a long three-lane road, grouped obstacles placed ahead, the controlled team near the bottom, and a clear lateral choice before contact. Unlike the reference, lane outcome numbers are intentionally absent because the learning goal requires prediction before feedback.

## Focused region comparison evidence

The runner/obstacle region was checked separately at readable size. The cyan packet squad and coral interference formations are sharp, directionally consistent, and visually separated from the road. Lane labels remain readable without exposing score deltas. A separate focused crop was unnecessary because the full 1363 × 936 capture rendered both the sprites and labels clearly.

## Required fidelity surfaces

- Fonts and typography: Korean labels use consistent bold hierarchy; the situation prompt is dominant and lane labels are readable at the captured viewport. No answer value appears before impact.
- Spacing and layout rhythm: the track occupies the central field, choice formations align to lane centers, and the player squad remains anchored at the lower third like the references.
- Colors and visual tokens: cyan player/feedback, coral interference, and per-world accents preserve the existing Signal Rush palette while matching the reference's strong team-versus-obstacle contrast.
- Image quality and asset fidelity: generated 3D packet, interference, and relay assets are real raster assets with transparent backgrounds, clean crops, consistent lighting, and no placeholder or CSS-drawn substitutes.
- Copy and content: option copy describes network conditions only. Numeric gains/losses and explanatory details appear after collision. The route-choice screen retains strategic numbers because those are known trade-offs, not hidden gate answers.

## Interaction checks

- Started a new run and entered Chapter 1.
- Moved from the center lane to the left lane during an active decision.
- Verified timer progress continued downward after movement instead of restarting (`85.84%` before movement, `42.15%` later).
- Completed Chapter 1, selected the fast route, and entered Chapter 2.
- Verified post-contact feedback still reveals the actual fragment change and explanation.
- Checked console output. The only localhost warning was a hydration notice caused by Cloud Browser extension attributes injected into `<html>`; no application runtime error was observed.

## Findings

No actionable P0, P1, or P2 visual or interaction issues remain for this revision.

## Comparison history

Initial issues supplied by the user:
- P0: moving lanes restarted the decision timer.
- P1: visible lane deltas disclosed the correct answer before a decision.
- P1: the flat gate-card presentation did not resemble a runner with obstacles ahead.

Fixes applied:
- Decoupled the event timer from lane and fragment state by reading live values from stable refs.
- Removed all pre-contact deltas, positive/negative colors, and result descriptions from lane choices.
- Rebuilt the playfield with a raised camera, longer three-lane road, grouped 3D obstacles, and a 3D packet squad.
- Increased decision time to 5–8 seconds and lengthened post-contact explanation time.

Post-fix evidence:
- Browser interaction confirmed lane movement does not reset progress.
- Browser capture confirmed all three lanes show condition labels and “결과 비공개” rather than deltas.
- Side-by-side visual inspection confirmed the intended high-camera runner silhouette and grouped obstacle composition.

## Follow-up polish

- P3: a future iteration could add world-specific obstacle assets for anchors, rain, servers, and buildings while keeping outcomes hidden.

final result: passed
