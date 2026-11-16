# VERTEX Design System — Ember

> Implementation-aligned reference for the `ui-revamp-ember` UI.
> This document is reconstructed from the committed Tailwind and global CSS tokens, not copied from the unavailable Claude Design artifact. The six mock screens remain in that artifact; this file documents the implementation that is actually in the repository.

## Design direction

- Dark-only, warm graphite interface.
- Ember orange is the single product accent, reserved for primary actions, focus, active navigation, and progress.
- Neutral warm-gray text and surfaces; avoid introducing unrelated blue, indigo, or violet accents.
- Dense developer tooling layout with clear hierarchy, restrained borders, subtle elevation, and compact metadata.
- Preserve all existing curriculum, OA, scenario, progress, and navigation behavior. This is a visual system, not permission to change product data or semantics.

## Color tokens

Values below are sourced from `tailwind.config.js`.

| Token | Value | Intended use |
|---|---|---|
| Canvas | `#0a0a09` | App background |
| Surface 0 | `#0d0d0c` | Lowest container / input background |
| Surface 1 | `#111110` | Default panel and sidebar |
| Surface 2 | `#171715` | Raised panel, hover, secondary button |
| Surface 3 | `#1e1e1b` | Tracks and higher surface |
| Surface 4 | `#272723` | Active/pressed surface |
| Surface 5 | `#32322d` | Highest neutral surface |
| Accent | `#ff6a3d` | Ember primary accent |
| Accent hover | `#ff7d55` | Hover state |
| Accent active | `#e85a2e` | Pressed state |
| Accent text | `#140a06` | Foreground on solid accent |
| Success | `#4cc38a` | Positive state |
| Warning | `#e0a43a` | Caution / due state |
| Danger | `#f0647e` | Error / destructive state |
| Info | `#9b978c` | Neutral compatibility token |
| Text primary | `#eceae4` | Headings and primary content |
| Text secondary | `#b4b0a5` | Supporting content |
| Text tertiary | `#8e8a7f` | Muted labels |
| Text quaternary | `#6e6a61` | Placeholder / lowest-emphasis content |

### Borders

- Subtle: `rgba(255,255,255,0.045)`
- Default: `rgba(255,255,255,0.07)`
- Hover: `rgba(255,255,255,0.13)`
- Active: `rgba(255,255,255,0.24)`

### Semantic color usage

- Do not use the accent as a generic decorative color; reserve it for primary interaction and progress.
- Success, warning, and danger communicate state and must not be used interchangeably.
- Info is deliberately neutral for compatibility; do not use it to reintroduce blue.
- Never communicate status by color alone; retain text or icon labels.

## Contrast reference

Ratios below are WCAG relative-luminance contrast calculations from the literal hex values in the committed token configuration. These are token-pair reference values, not a claim that every rendered component has been audited. Alpha-composited backgrounds, gradients, images, hover states, and small text need separate rendered-state checks.

| Foreground | Background | Contrast |
|---|---|---:|
| Text primary `#eceae4` | Canvas `#0a0a09` | 16.46:1 |
| Text secondary `#b4b0a5` | Canvas `#0a0a09` | 9.14:1 |
| Text tertiary `#8e8a7f` | Canvas `#0a0a09` | 5.75:1 |
| Text quaternary `#6e6a61` | Canvas `#0a0a09` | 3.68:1 |
| Accent `#ff6a3d` | Canvas `#0a0a09` | 6.96:1 |
| Accent text `#140a06` | Accent `#ff6a3d` | 6.86:1 |
| Success `#4cc38a` | Canvas `#0a0a09` | 8.94:1 |
| Warning `#e0a43a` | Canvas `#0a0a09` | 9.00:1 |
| Danger `#f0647e` | Canvas `#0a0a09` | 6.44:1 |
| Info `#9b978c` | Canvas `#0a0a09` | 6.79:1 |

WCAG 2.2 AA reference thresholds: 4.5:1 for normal text and 3:1 for large text. The quaternary text/canvas pair is below 4.5:1 and should remain limited to non-essential, low-priority metadata; do not use it for body copy or important controls. Validate actual component pairings before treating the UI as fully conformant.

## Typography

Font stacks are sourced from `tailwind.config.js` and `src/index.css`.

- **UI / body:** Inter, then system sans-serif fallbacks.
- **Technical metadata / counts / code / keycaps:** JetBrains Mono, then system monospace fallbacks.
- Inter is loaded locally at variable weights 300–700; JetBrains Mono is loaded locally at weights 400–500.
- Body rendering uses antialiasing and the configured Inter OpenType features.
- Use compact type for navigation, badges, metadata, and controls; use stronger, larger sans-serif type for page titles and primary content.
- Use tabular numerals (`tnum` / `font-variant-numeric: tabular-nums`) for counts, statistics, timers, and aligned numeric values.
- Uppercase mono labels use restrained tracking; do not apply tracking to paragraphs or long-form reading text.
- Preserve readable line-height and responsive scaling; avoid reducing essential text to decorative microcopy sizes.

## Shape, elevation, and interaction

- Radius scale: 4px (`sm`), 6px (default), 8px (`md`), 10px (`lg`), 14px (`xl`).
- Panels use a subtle top inset highlight and low-contrast border; interactive panels lift through surface and border changes rather than large transforms.
- Primary buttons use the solid accent, dark accent foreground, subtle inset highlight, and restrained Ember glow.
- Secondary buttons use neutral raised surfaces and borders.
- Inputs use Surface 0, primary text, and an Ember focus border/ring.
- Keyboard shortcut keycaps use a small vertical gradient, inset highlight, and compact monospace text.
- Progress tracks use Surface 3; the filled portion uses the accent with a restrained glow.
- Focus-visible controls use a 2px Ember outline with a 1px offset.
- Respect disabled states; do not rely on hover alone to expose functionality.

## Layout and responsive behavior

- Application shell: fixed-width desktop sidebar, compact top bar, independently scrollable main content.
- Main content uses a centered max-width container with responsive horizontal padding.
- Use compact spacing and card groupings appropriate for a developer dashboard; preserve clear section separation.
- Sidebar collapses behind a mobile menu/backdrop at smaller breakpoints.
- Keep all actions reachable by keyboard and ensure responsive layouts do not hide essential controls.

## Component vocabulary

Use the existing global classes in `src/index.css` where applicable:

- Containers: `.panel`, `.panel-subtle`, `.panel-interactive`
- Actions: `.btn-primary`, `.btn-secondary`, `.btn-subtle`, `.btn-ghost`, `.btn-danger`
- Forms: `.input-field`
- Status: `.badge`, `.badge-accent`, `.badge-easy`, `.badge-medium`, `.badge-hard`
- Navigation: `.nav-item`, `.nav-item-active`
- Keyboard hints: `.kbd-key`
- Progress: `.track-bar`, `.track-fill`

Prefer these shared primitives over one-off styling so visual changes remain consistent.

## Quality gates before changing the system

1. Keep the dark-only graphite/Ember palette and single-accent rule.
2. Check foreground/background contrast for each actual component state, including alpha overlays.
3. Verify keyboard focus, disabled, hover, active, and error states.
4. Test dashboard, pattern map/explorer, pattern detail, solve/workspace, command palette, OA questions, and long scenario questions at desktop and mobile widths.
5. Do not alter curriculum or question catalogue data as part of a visual-only change.
6. Run TypeScript, lint, unit tests, and the production build before release.
