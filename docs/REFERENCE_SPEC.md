# Igloo Reference Visual & Interaction Specification (`docs/REFERENCE_SPEC.md`)

Reference frames extracted at 1 fps from `Screen_Recording_2026-11-25_103538.mp4` into `/reference/igloo/frame_01.png` through `frame_55.png`.  
Crystal gallery behavior corresponds primarily to `frame_03.png`–`frame_24.png` (and carousel/bracket HUD motifs in `frame_40.png`).  
Note: Do **not** copy any Igloo branding (`IGLOO`, `Pudgy Penguins`, Web3 manifesto copy, audio, or 3D assets); use only original geometry, shaders, and Chirag H M's data.

---

## 1. Glass Crystals (`frame_03`, `frame_06`, `frame_09`, `frame_24`)
- **Form & Geometry:** Floating, jagged, faceted crystalline ice/quartz shards suspended vertically in space. Surfaces show fractured sharp facets combined with flat planar cleavage faces (`flatShading`), suggesting a displaced/deformed icosahedron or eroded polyhedral block.
  - *UNCERTAIN:* Whether Igloo's reference crystal mesh uses hand-sculpted GLTF/Draco geometry or multi-octave Voronoi/simplex vertex displacement + normal maps (`UNCERTAIN`). Our original version uses seeded multi-plane/deformed icosahedron geometry (`flatShading`) unique per project.
- **Material & Refraction:** High-clarity refractive glass/ice shell (`MeshTransmissionMaterial`) with strong cool-white rim specular edges, slight surface roughness, index of refraction (~1.45–1.55), thickness for optical depth, and subtle chromatic dispersion near edges (especially amplified during camera zoom transition in `frame_09`).
- **Interior Core:** Each crystal encloses a 3D centerpiece suspended inside the glass volume (`frame_06` shows the dark silhouette refracted behind curved/flat facets). For Chirag's 4 projects: renders the project's first local screenshot (`/projects/<slug>/1.webp`) when present on disk, or an architectural typographic core (`01`–`04` + project title) refracted through the crystal.
- **Surrounding Geo Hints:** Subtle thin hairline wireframe geometry / triangle callout ticks orbit faintly around the active crystal perimeter when hovered (`frame_06`, `frame_24`).

---

## 2. Fog, Backdrop & Atmosphere (`frame_03`, `frame_06`, `frame_24`)
- **Background & Fog:** Misty depth-faded atmosphere with bright cool-silver highlight gradients near center fading into deep slate perimeter (`UNCERTAIN` whether volumetric fog shader vs exponential scene fog + fullscreen gradient quad). Adapted to Chirag's `#0C0C0C` design system using `#0C0C0C` graphite exponential fog + deep slate radial atmospheric gradient behind crystals so cool-white rim reflections stay luminous.
- **Particles:** Faint slow-drifting dust motes / ice flecks suspended across camera depth planes (`frame_21`, `frame_24`).
- **Background Scrolling Telemetry:** Very faint, softened/low-opacity uppercase monospace strings drifting slowly in background depth bands (`TEMP`, numeric readouts, blurred metadata coordinates like `2024` in `frame_06`/`frame_24` at low opacity ~`0.06`–`0.12`).

---

## 3. HUD Lines, Mono Labels & Scrambled Text (`frame_03`, `frame_06`, `frame_24`, `frame_40`)
- **Anchor & Leader Lines:** Hovering a crystal reveals crisp hairline (`1px`) light-grey/white SVG callout lines extending diagonally (`45°` elbow + horizontal underline) from the crystal silhouette to stacked uppercase monospace blocks:
  - Upper-left callout: uppercase identifier + project name (e.g., `PRJ_01` + project title, equivalent to `PORTFOLIO_CO_01 / ...` in `frame_06`).
  - Secondary callout: metadata readout (`year` if present, stack tool count) and `CLICK TO EXPLORE` (`frame_24`).
- **Scramble Effect:** Text characters briefly cycle through random uppercase glyphs/symbols (`frame_03`: `D 01.02.3)3) / DNKEM WJ HTLPKVB` -> `frame_24`: `D 01.02.2020 / CLICK TO EXPLORE`) before locking left-to-right into final characters.
- **Carousel HUD (`frame_40` motif):** Left/right subtle directional arrows, bottom-center active title inside **four thin corner-bracket markers (`┌ ┐ └ ┘`)**, plus monospace index counter (`01 / 04`).

---

## 4. Dark Text Detail Panel (`frame_12`, `frame_15`, `frame_18`, `frame_21`)
- **Overlay Backdrop:** Clicking a crystal dollies the camera closely toward/into the shard while fading in a deep dark translucent scrim (`#0C0C0C` ~`84%` opacity with faint crystal silhouette visible centered behind the text, `frame_15`).
- **Typography & Layout:** Centered/narrow monospace column (`JetBrains Mono` / site mono, clean left alignment), structured by slash-prefixed section headers:
  - `/// Summary` (project summary copy)
  - `/// Stack` / `/// Links` (adapted cleanly from `/// Discover` and `/// Visit` bracketed links like `[website] ↑`)
  - Dedicated `Step inside →` CTA navigating to `/projects/:slug` (full case study).
- **Decrypt Reveal:** All panel body lines animate in via character scramble/decrypt settle (`frame_12` -> `frame_15` -> `frame_18`).
- **Dismissal:** Top-right corner-bracketed **`[ Close ]`** button (`┌ Close ┐` / `└     ┘` visual corners in `frame_12`–`frame_21`), `Esc` key, or backdrop exit smoothly returns camera to the gallery view.

---

## 5. Camera Motion & Interaction
- **Idle & Parallax:** Crystals rotate slowly around their vertical axis and respond smoothly to pointer coordinates (subtle camera parallax + hovered crystal gently tilts toward cursor).
- **Gallery Navigation:** Left/right arrow buttons, keyboard arrows, horizontal drag, or wheel/scroll glide the camera smoothly from crystal to crystal along the gallery arc/rail, updating the `01 / 04` counter and bottom-center bracketed label.
- **Inspect Dolly (`frame_09` -> `frame_12`):** Clicking the active crystal (or side crystal to focus then inspect) dollies camera close to the shard as chromatic dispersion spikes subtly before settling behind the dark monospace summary panel.
- *UNCERTAIN:* Exact spring damping constants and focal-blur shader strength between resting gallery and zoomed inspection (`UNCERTAIN`).

---

## Pedestal Scene (`frame_34`, `frame_37`, `frame_40`, `frame_44`, `frame_48`)

Reference frames `frame_34.png`–`frame_52.png` capture the circular pedestal sculpture showcase and dissolve transitions (used here as original structural inspiration for the **Stack** chapter, without any Igloo/social logos or assets).

### Stage & Lighting (`frame_34`, `frame_37`, `frame_40`)
- **Circular Glass Pedestal:** Multi-tiered dark/frosted circular platform seated at the lower third of the viewport, ringed by thin crisp concentric emissive hairline rings (`#D7E2EA` / cool white) separating beveled horizontal discs.
- **Overhead Halo & Reflection:** Matching soft luminous circular overhead ring above the sculpture pairs with a subtle radial glow and faint mirrored floor reflection across the pedestal deck (`UNCERTAIN`: exact implementation may be a planar reflector, cube/PMREM specular reflection, or radial floor reflection pass).
- **Atmosphere:** `#0C0C0C` deep graphite exponential fog, soft cool-white rim lighting separating silhouettes from the void, and very faint blurred mono telemetry bands drifting behind the sculpture.

### Particle Sculptures & GPU Shader (`frame_40`, `frame_48`)
- **Density & Rendering:** Single GPU `ShaderMaterial` point cloud (`~25,000` points on desktop, `~10,000` on weaker devices) with soft circular antialiased sprite falloff, distance attenuation, depth/azimuthal contrast lighting (bright cool-white highlights with darker charcoal crevices), and a subtle hint of the portfolio CTA accent near the base.
- **Original Procedural Shapes (Zero Logos):**
  1. `Frontend`: Layered floating UI/browser frame planes arranged in depth paired with a clean 3D wireframe cube lattice.
  2. `Backend`: Stacked server-rack cylinders with segmented radial data rings and vertical rack columns.
  3. `AI & APIs`: Orbital constellation sphere of dense nodes linked by curved neural-style connection arcs.
  4. `IoT`: Chamfered square microchip die with outward perimeter pin rows and concentric radiating signal arcs.
- **Cursor Interaction:** Idle vertical-axis rotation; raycasted pointer hover gently pushes nearby particles outward along radial/curl vectors before they spring back smoothly when the cursor moves away.

### Morph Behaviour (`frame_44`)
- **Staggered Curl Dissolve:** Transitions between sculptures never translate directly; instead each particle uses a deterministic random delay seed (`aDelay`) plus 3D curl-like trigonometric swirl displacement peaked at mid-transition (`sin(pi * localProgress)`), causing particles to break apart into bright turbulent eddies (`frame_44`) before condensing into the next procedural sculpture.
- *UNCERTAIN:* Exact curl noise frequency/octave curve and peak mid-morph point-size bloom multiplier (`UNCERTAIN`).

### Carousel & Stack HUD (`frame_40`, `frame_44`, `frame_48`)
- **Bottom Carousel:** All four Stack group labels displayed across the foreground stage with four thin corner brackets (`┌ ┐ └ ┘`) framing the active group label, interactive left/right hairline arrows, keyboard arrows, horizontal drag, and scroll-linked stepping inside a pinned `260vh` section matching the Projects cadence.
- **Side Tool HUD:** Clean monospace overlay beside the sculpture displaying the active `01 / 04` counter, group subtitle, and the active group's tools from `src/data/skills.ts` animated via scramble/decrypt reveal, showing the hovered/focused `skill.note` cleanly while hiding any empty fields.
- *UNCERTAIN:* Exact camera tilt angle and field-of-view transitions between scroll entry (`frame_34`->`frame_37`) and resting carousel lock (`frame_40`) (`UNCERTAIN`).

---

## Landscape Ending (`frame_01`, `frame_52`, `frame_53`, `frame_54`, `frame_55`)

Reference frames `frame_01.png` and `frame_52.png`–`frame_55.png` capture the expansive mountain landscape finale and corner editorial framing (adapted as an original moonlit range and research cabin/beacon without Igloo geometry, copy, or assets).

### Terrain, Atmosphere & Lighting (`frame_01`, `frame_52`, `frame_53`, `frame_55`)
- **Mountain Range Geometry:** Noise-displaced low-poly terrain grid (`flatShading`) with layered foreground ridge, sheltered valley corridor, and distant receding mountain peaks merging smoothly into cool atmospheric fog. Adapted to the site palette (`#0C0C0C` moonlit night void, dark basalt valley slopes, cool pale-silver frost/snow vertex coloring on high crests and upward facets).
- **Lighting & Sky:** High oblique cool-white/blue-silver moonlight directional light + soft dark ambient fill, exponential night fog (`fogExp2`), sparse instanced star field above the haze, and gentle falling snow/ice dust particles on desktop.
- *UNCERTAIN:* Exact fog extinction density falloff and camera clip distance in the reference landscape pass (`UNCERTAIN`).

### Original Cabin & Signal Beacon (`frame_01`, `frame_53`–`frame_55` motif)
- **Architectural Cabin (Original Substitute):** Small mountain shelter composed strictly from boxes and angled roof planes seated on a flattened saddle crest (`sampleTerrainHeight`), featuring a warm emissive window spilling amber point light onto the adjacent foreground snow.
- **Radio / Beacon Tower:** Slender antenna mast beside the cabin with a pulsing apex emitter light that periodically broadcasts expanding fading translucent signal rings into the night sky (and emits a brighter boosted pulse when `"Send a signal"` is triggered).

### Camera Path & Corner Overlay (`frame_01`, `frame_53`, `frame_55`)
- **Scroll-Linked Flight Path:** Pinned `260vh` scroll runway opening high and wide across the mountain ridge tops (`progress = 0`), then gliding smoothly along a collision-safe altitude curve down toward a close scenic framing beside the cabin and beacon (`progress = 1`), with subtle pointer parallax.
- **Corner & Finale Overlay:**
  - Top-left monospace copyright (`© 2026 CHIRAG H M`).
  - Top-right `aboutParagraph` bio snippet from `src/data/config.ts`.
  - Near the end of scroll (`progress >= 0.56`), fade in large `.hero-heading` `LET'S TALK` typography, non-empty contact links from config (`email` copy with toast, `githubUrl`, `linkedInUrl`, conditional `resumeUrl`), `"Send a signal"` interactive beacon-pulse/copy CTA, and `Back to top ↑`.
- *UNCERTAIN:* Exact easing ratio between vertical camera drop and final close-up lookAt target toward the cabin window (`UNCERTAIN`).
