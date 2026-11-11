# Approved pixel-art nebula cloud

Generated with the built-in image tool for the pixel-art preview and subsequently approved by the user. This is the exact selected preview, promoted without another generation or artistic alteration.

- `cloud-source.png`: retained generated original with transparency.
- `cloud.png`: approved proportional preparation, bounded by 384 by 192 pixels, nearest-neighbor sampled with transparency preserved.
- Recreate the preparation with `node tools/prepare-nebula-cloud.cjs` after the headless QA setup; embed it with `npm run art:plasma` and `npm run build`.

The checked-in native PNG is the normal build input. Browser preparation and image generation are optional development steps. The earlier smooth texture remains under `nebula-cloud-v1` for history.

## Exact generation prompt

Use case: stylized-concept. Asset type: PREVIEW-ONLY transparent nebula texture for the top-down pixel-art space roguelike Prospector II. The reference image is an actual game screenshot: use ONLY the tiny ships and brown asteroids as reference for deliberate pixel-art clusters and restrained visual complexity. The current smooth nebula in that screenshot is the part being replaced. Generate a new standalone horizontal nebula cloud texture, not a screenshot or UI mockup. Broad organic swirls and irregular wispy lobes with spacious transparent gaps. Use a tightly limited palette of 7 dark navy/indigo/slate-blue colors, a few muted blue-violet midtones, and transparent negative space. Hand-placed-looking crisp square pixel clusters, clear stepped contour shapes, simplified banded shading with discrete color transitions, like careful 1990s space-game pixel art. Subdued and atmospheric, with enough dark space that tiny ships remain readable. The cloud must remain a nebula, with flowing interlocking masses and a few tendrils, not a collection of round puffs or separate rocks. Design detail for a logical texture about 384 by 192 pixels; use consistent small pixel clusters across the artwork, not giant mosaic blocks. Overall silhouette approximately 2:1, centered with transparent margins. Entire background and holes truly transparent. No stars, ships, asteroids, planet, lightning, grid, frame, letters or labels. No photorealism, continuous gradients, blur, photographic wisps, glowing bloom, noise grain, 3D rendering, checkerboard background or painted watercolor texture. Deliver one cloud texture only.
