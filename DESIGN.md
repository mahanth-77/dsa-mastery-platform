# DSA Pattern Mastery — Design System v0.2 (dark-only)

Status: direction proposal, tested on six mock screens (landing, dashboard, pattern map, pattern page, solve workspace, command palette). Supersedes v0.1, which assumed light and dark themes.

## 0. What is verified and what is not

Verified
- Contrast ratios below, computed with a script (WCAG relative luminance), not estimated.
- The token set is applied consistently across all six mock screens.

Not verified
- I have not rendered or screenshotted the mock screens, so spacing, glow intensity and font loading are unseen.
- I could not open the six reference sites live, so their motion and mobile behaviour were never inspected. Reference notes come from official posts and docs (Linear, Vercel Geist, Raycast, Notion) plus unofficial third-party extractions for Stripe and Apple. Re-check motion and mobile in a real browser before locking them.
- Motion values and mobile layouts are reasoned from documented principles.

## 1. Identity

Positioning: a precise, quiet workbench for learning to recognise patterns, not a course platform.

Metaphor: the ledger and the workbench. Learning state is recorded like a ledger (dense, tabular, exact). Practice happens on a workbench (a focused split workspace).

What each reference contributes (decisions, not looks)
- Linear: chrome recedes, content leads. Dimmed sidebar, soft borders, alignment treated as a feature.
- Stripe: trust through typographic discipline and tabular numerals on all data.
- Vercel: developer precision. Geist with Geist Mono, hairline structure, a visible grid.
- Raycast: the app is a command palette scaled up. Visible keycaps, compact uniform rows, a loading line at the top edge.
- Apple: one idea per section on the landing page, large whitespace, a real product image as the hero.
- Notion: reading rhythm and grouping by relationship (used on the pattern page).

Principles
1. Chrome recedes, content leads.
2. Numbers are first-class: tabular figures wherever progress is shown.
3. Everything is reachable by keyboard and every shortcut is visible.
4. Group by relationship and divide with hairlines. Raised panels only for things that are genuinely objects (the review queue, the map canvas, code, the palette).
5. Glow is reserved for progress and the primary action. If everything glows, nothing does.

## 2. Typography

Two families: Geist Sans and Geist Mono (both open source, loaded from Google Fonts in the mocks; self-host for production). Fallbacks: Inter, system-ui; ui-monospace.

| Token | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| display-xl | clamp(44, 8vw, 84) / 1.02 | 500 | -0.055em | Landing hero |
| h2 | clamp(30, 4.2vw, 48) / 1.08 | 500 | -0.04em | Landing sections |
| display-lg | 40 / 44 | 500 | -0.04em | Pattern page title |
| page title | 28 / 34 | 500 | -0.03em | App page titles |
| heading | 18 / 26 | 500–600 | -0.02em | Subsections |
| body-lg | 17 / 28 | 400 | 0 | Lesson prose and landing copy |
| body | 14 / 22 | 400 | 0 | App UI |
| label | 13 / 20 | 500 | 0 | Buttons, nav, table cells |
| caption | 12 / 16 | 400 | 0 | Metadata |
| code | 13 / 20 | 400 mono | 0 | Code and inline code |
| eyebrow | 11 / 16 | 500 mono | 0.08em, uppercase | Section labels and IDs |

Rules
- Weights: 400, 500, 600 only. Display sizes use 500 because heavy weights look coarse on dark backgrounds.
- Tracking tightens as size grows.
- `font-variant-numeric: tabular-nums` on the whole app shell.
- Lesson text column: 66ch or narrower.

## 3. Colour (dark only)

Warm graphite neutrals with one accent, Ember. No purple, blue or pink gradients.

```css
:root {
  --bg:        #0A0A09;  /* canvas */
  --side:      #0D0D0C;  /* sidebar, slightly lifted */
  --surface:   #111110;  /* raised panels, code */
  --sunk:      #070706;  /* wells */
  --border:    rgba(255,255,255,0.07);  /* hairline */
  --strong:    rgba(255,255,255,0.13);  /* table headers, keycaps, outlines */
  --hover:     rgba(255,255,255,0.05);
  --hl:        rgba(255,255,255,0.06);  /* inner top highlight on raised things */
  --text:      #ECEAE4;
  --muted:     #9B978C;
  --accent:    #FF6A3D;  /* Ember */
  --on-accent: #140A06;  /* text on Ember */
  --glow:      rgba(255,106,61,0.38);
  --success:   #4CC38A;
  --warning:   #E0A43A;
  --danger:    #F0647E;
}
```

Computed contrast (WCAG)

| Pair | Ratio |
|---|---|
| text on bg | 16.5 |
| muted on bg | 6.8 |
| muted on surface | 6.5 |
| muted on sidebar | 6.7 |
| Ember on bg | 7.0 |
| on-accent text on Ember | 6.9 |
| success on bg | 8.9 |
| warning on bg | 9.0 |
| danger on bg | 6.4 |

All pass AA (4.5:1). Do not introduce a "faint" text colour below `--muted`; a dimmer grey would fall under AA.

Usage rules
- Ember marks identity, progress and the primary action only, never a state. Status is carried by a dot plus a word (success, warning, danger), so it never relies on colour alone.
- Where Ember sits next to warning or danger, they differ in hue and always carry a text label.
- Gradients: allowed only as (a) a faint warm radial wash behind page headers and the landing hero, and (b) Ember progress fills. Never on text or buttons.
- Depth comes from surface steps, hairlines and an inner top highlight first, shadow second. Glow is limited to the primary button, progress fills and rings, active heatmap cells, and the selected map node.

## 4. Layout

- 4px base. Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 140, 160 (landing section gaps).
- App shell: sidebar 240px with grouped sections ("Learn", "Practice"), main content, optional right panel 300–340px.
- Landing: 1200px container, a 12-column hairline grid fading out behind the hero, asymmetric 5/7 feature rows that alternate sides.
- Radii: 5 (keycaps), 6–7 (chips, nav rows), 8–10 (buttons), 12–16 (panels, palette).
- Pages are fluid with `flex-wrap` so the sidebar stacks on narrow screens.

## 5. Page patterns

| Page | Idea |
|---|---|
| Landing | Editorial hero with the real Pattern Map as the product image, then four alternating feature rows, then one closing call to action. |
| Dashboard | A dial of 18 radial ticks showing patterns locked in, a raised "due for review" queue, and a ledger table below. |
| Pattern map | A dotted canvas with 12 nodes, each a progress ring. Cleared prerequisites are Ember lines, open ones are faint. Selected node gets a detail panel. |
| Pattern page | Reading column plus a sticky-style right rail: mastery, complexity, problems, related patterns. |
| Solve workspace | Problem and hint ladder on the left, code and results on the right. |
| Command palette | Centred overlay over a blurred app, recent and actions sections, shortcut keycaps, footer legend. |

## 6. Components and states

Every interactive element defines default, hover, focus, active, disabled, loading, success and error.

- Focus: 2px Ember outline, 2px offset, always visible.
- Hover: a 5% white overlay. 140ms.
- Active: 1px downward shift.
- Disabled: 40% opacity, default cursor.
- Loading: a 2px Ember light sweep along the top edge of the panel (shown on the palette).
- Success and error: dot or icon plus a word. Success reveals briefly then settles.
- Primary button: Ember fill, dark text, inner top highlight, thin Ember ring, soft glow below.
- Keycap: mono 11px, vertical gradient, 1px border, 5px radius, inset top highlight and a dark bottom edge.
- Chip: 24px tall, hairline border, dot plus label.
- Ledger rows: 48px, hairline dividers, tabular numbers, mono eyebrow headers.

## 7. Motion (reasoned, not observed on the references)

- 120–140ms for hover and press, 180–240ms for panels, 320–480ms only for completion moments.
- Easing `cubic-bezier(0.2, 0, 0, 1)`. Animate opacity and transform only.
- `prefers-reduced-motion` removes all transitions and the loading sweep.
- No decorative looping animation in the app.

## 8. Signature experiences

1. Pattern Map (built as a mock). Relationships and prerequisites at a glance. Not yet built: filtering, selection updating the side panel, zoom and pan.
2. Command palette (built as a mock). Search plus actions, with two-key shortcuts such as G then M.
3. Solve workspace hint ladder (built, working in the mock). Pattern hint, then approach, then solution, revealed one step at a time.
4. Mastery ledger (built as a mock). Exact numbers and a 14-day activity strip per pattern.
5. Pattern lock-in moment (not yet designed). One restrained fill when a pattern crosses the mastery threshold. Depends on the mastery model.

## 9. Keyboard model

- `⌘K` palette, `/` focus search, `G` then `D` dashboard, `G` then `M` map, `G` then `R` review.
- `J` and `K` move through lists, `↵` open, `esc` close.
- `⌘↵` run, `⌘⇧↵` submit, `?` shortcut overlay.

## 10. Accessibility and responsive

- AA contrast on every text pair (see section 3).
- Real buttons and links, labelled icon-only controls, decorative graphics hidden from assistive tech.
- Mobile (not yet designed): sidebar becomes a bottom tab bar, the solve workspace stacks, the map becomes a list with a map toggle. The landing page already wraps to a single column but has not been checked at phone width.

## 11. Open items

1. Render the six mock screens and review spacing, glow and font loading by eye.
2. Check the reference sites' motion and mobile behaviour in a real browser.
3. Decide the mastery model (threshold, review spacing), since the dial, ledger and lock-in moment depend on it.
4. Design the mobile screens.
5. Make the map interactive and design the lock-in moment.
6. Confirm Geist licensing and self-host the fonts.
7. Share your tech stack so the tokens can map to real components.

## 12. Final creative test (re-run on rendered screens)

- Next to Linear: depends on how quiet the chrome looks once rendered.
- Stripe-level sophistication: depends on the ledger and numerals holding up.
- Vercel-level developer feel: Geist, mono eyebrows and hairlines are in place.
- Raycast-level interaction: the palette and keycaps are designed but not yet interactive.
- Apple-level presentation: the landing page uses a real product hero, but this needs a visual check.
