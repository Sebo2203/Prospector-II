# Generated combat asteroid art

Generated with the built-in `image_gen` tool for Prospector II. These are new standalone assets; the original Prospector atlas is unchanged.

- `horizontal-source.png`, `vertical-source.png`, `square-source.png`: retained generated originals, with transparency.
- `asteroid-2x1.png`, `asteroid-1x2.png`, `asteroid-2x2.png`: cropped to alpha bounds and proportionally reduced to fit their native 48×24, 24×48 and 48×48 canvases, with a two-pixel transparent margin. No anisotropic stretching or source-rock compositing.
- Recreate the native sprites with `node tools/prepare-combat-asteroids.cjs` after the normal [headless QA setup](../../../../qa/README.md); embed with `npm run art:plasma` and then `npm run build`. Optional `PROSPECTOR_QA_CHANNEL` selects an installed browser in the same way as QA scripts.

Preparation crops to the generated alpha bounds and downsamples proportionally with nearest-neighbor sampling, preserving transparency and crisp pixels. The final sprites are versioned inputs to the normal Node import/build; browser preparation and image generation are not needed to build or play the game.

## Exact generation prompts

### horizontal

Use case: stylized-concept. Asset type: a single transparent pixel-art sprite for a top-down space roguelike. Draw ONE normal-looking, solid, irregular elongated asteroid, roughly twice as wide as tall, horizontal orientation. One cohesive natural boulder, broad connected silhouette, slightly angular/chipped outline, varied shallow craters and subtle cracks. Brown-gray stone with muted warm ochre highlights, dark brown-gray shadow; light from upper left. Authentic detailed late-1990s 2D pixel-game art, designed to read at only 48 by 24 pixels; crisp square pixel clusters, restrained palette and clear volume. The object must span left and right halves with generous thickness through its center, no narrow neck. Isolated centered asset with a small transparent margin on every side. Background truly transparent. No ground, no stars, no atmosphere, no cast shadow outside the asteroid, no text or labels. Do not show a pile, chain, cluster of rocks, gravel, donut holes, limbs or a stretched/squashed texture. Surface craters should be round in perspective; create the elongated body naturally. Deliver one asteroid only.

### vertical

Use case: stylized-concept. Asset type: a single transparent pixel-art sprite for a top-down space roguelike. Draw ONE normal-looking, solid, irregular elongated asteroid, roughly twice as tall as wide, vertical orientation. One cohesive natural boulder, broad connected silhouette, slightly angular/chipped outline, varied shallow craters and subtle cracks. Brown-gray stone with muted warm ochre highlights, dark brown-gray shadow; light from upper left. Authentic detailed late-1990s 2D pixel-game art, designed to read at only 24 by 48 pixels; crisp square pixel clusters, restrained palette and clear volume. The object must span upper and lower halves with generous thickness through its center, no narrow neck. Isolated centered asset with a small transparent margin on every side. Background truly transparent. No ground, no stars, no atmosphere, no cast shadow outside the asteroid, no text or labels. Do not show a pile, chain, cluster of rocks, gravel, donut holes, limbs or a stretched/squashed texture. Surface craters should be round in perspective; create the elongated body naturally. Deliver one asteroid only.

### square

Use case: stylized-concept. Asset type: a single transparent pixel-art sprite for a top-down space roguelike. Draw ONE normal-looking large solid asteroid, roughly square overall footprint but an irregular natural polygonal/boulder silhouette, a little asymmetric rather than circular. One cohesive massive boulder, broad connected silhouette filling all four quadrants, slightly angular/chipped outline, varied shallow craters and subtle cracks. Brown-gray stone with muted warm ochre highlights, dark brown-gray shadow; light from upper left. Authentic detailed late-1990s 2D pixel-game art, designed to read at only 48 by 48 pixels; crisp square pixel clusters, restrained palette and clear volume. Isolated centered asset with a small transparent margin on every side. Background truly transparent. No ground, no stars, no atmosphere, no cast shadow outside the asteroid, no text or labels. Do not show a pile, cluster of separate rocks, gravel, donut holes, limbs or a stretched texture. Deliver one asteroid only.

