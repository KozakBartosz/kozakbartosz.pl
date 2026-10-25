# Portfolio refresh backlog

## Purpose

Track the incremental refresh of the existing portfolio. The first phase focuses on typography, section composition, and left-side section navigation. Phases 1 and 2 are implemented. Phase 3 verification results and remaining limitations are recorded below.

All Markdown documentation must be written in English.

## Agreed design direction

- Use the supplied reference image as inspiration for type hierarchy, spacing, section labels, skill chips, and left-side navigation.
- Preserve the existing blue-to-green gradients as a signature of the portfolio. Do not replace them with the reference's flat cyan treatment.
- Keep the dark background and the relationship between text and 3D visuals.
- Give section headings more presence through large, light typography and deliberate line breaks.
- Improve reading comfort with clearer body typography, controlled line lengths, and more intentional spacing.
- Treat Skills as a subsection of its parent section, without another section number.
- Introduce left-side section navigation with an active number and a short vertical line, inspired by the reference. Its exact arrangement can be adapted to the portfolio.
- Defer the top menu entirely.

## Phase 1: Typography and section layout

### 1. Establish the typography system

- [x] Review the current Raleway font and compare suitable weights or alternatives against the reference, using actual portfolio text.
- [x] Define a responsive type scale for section headings, body text, subsection headings, navigation numbers, and small labels.
- [x] Use large, light section headings with controlled wrapping on desktop and mobile.
- [x] Preserve gradient emphasis in headings and selected accents; keep paragraph text easy to read.
- [x] Adjust body line height, paragraph spacing, and maximum text width.
- [x] Replace viewport breakpoint changes to the root font size with deliberate responsive sizing where appropriate.

### 2. Recompose the existing sections

- [x] Introduce a consistent section structure: optional numbered label, main heading, description, and supporting skills or contact content.
- [x] Improve the balance between the text column and the corresponding 3D visual.
- [x] Establish consistent spacing between section labels, headings, paragraphs, and skills.
- [x] Review oversized mobile margins so the content does not require excessive scrolling through empty space.
- [x] Preserve alignment between HTML section anchors and their 3D models when changing layout.
- [x] Apply the shared typography and spacing rules to the frontend, design, and contact sections.

### 3. Restyle skills

- [x] Replace comma-separated skill lists with wrapping, text-based chips inspired by the reference.
- [x] Keep a simple Skills label without a number or a separate pagination entry.
- [x] Use restrained borders and existing gradient accents without competing with the main heading.
- [x] Keep chips readable and clearly non-interactive unless they have an actual action.
- [x] Allow skill groups to wrap naturally on narrow screens.

## Phase 2: Left-side section navigation

- [x] Define navigation entries from the actual top-level sections; do not copy the reference's four entries automatically.
- [x] Give each navigable section a stable anchor ID.
- [x] Add a compact left-side navigation rail with section numbers and a vertical line indicating the active entry.
- [x] Update the active entry as the reader scrolls through sections.
- [x] Allow navigation entries to move to their corresponding sections.
- [x] Provide accessible section names, visible keyboard focus, and an active-state announcement using appropriate semantics.
- [x] Adapt or hide the rail on narrow screens where it would overlap content or 3D interactions.
- [x] Respect reduced-motion preferences for animated scrolling and rail transitions.

## Phase 3: Verification

- [x] Check desktop, tablet, and mobile layouts, including long headings and wrapped skill chips.
- [x] Check text contrast and readability over the existing background and gradient effects.
- [x] Verify that the section navigation follows scrolling and reaches the correct anchors.
- [x] Verify keyboard navigation and reduced-motion behavior.
- [x] Check that layout changes preserve 3D positioning, scrolling behavior, and pointer interactions.
- [x] Run the project's applicable build and lint checks, and record any existing blockers separately.
- [x] Compare the result visually with the reference and the agreed gradient treatment.

## Deferred work

- Top menu redesign or implementation.
- Full copy rewrite and CV-based positioning changes.
- Project case studies and employment history sections.
- Framework and dependency upgrades.
- Redesigning or replacing the 3D scene and its models.

## Implementation map

| Area | Existing files |
| --- | --- |
| Page composition and metadata | `src/pages/index.tsx` |
| Section content, layout, and HTML anchors for 3D icons | `src/components/Section.tsx` |
| Global typography and gradient styles | `src/styles/globals.css` |
| Hero composition | `src/components/hero/Hero.tsx` |
| Scroll-driven camera | `src/components/hero/CameraEffects.tsx` |
| Models positioned relative to HTML sections | `src/components/hero/Icon.tsx` |

## Decisions to resolve during implementation

- Final font family and supported weights.
- Exact heading wraps and gradient emphasis.
- Whether the hero receives its own left-navigation entry.
- Rail placement and active-line animation.
- Mobile treatment of the left navigation.

Resolve these through visual iteration while preserving the agreed scope above.


## Implementation decisions and verification

- Retained Raleway: weight 300 gives the existing headings the light appearance of the reference; weight 400 keeps the actual long paragraphs readable. Weight 100 was rejected for small-size contrast.
- Kept the root at 10px and introduced a fluid heading scale, 17–20px body text, 12px labels, and 13px chips. The existing blue-to-green treatment remains.
- Navigation includes Development, Design, and Contact. The interactive opening scene is now the first entry, Home (01), followed by Development (02), Design (03), and Contact (04). Skills remain subordinate lists.
- Kept alternating desktop columns and DOM-driven model anchors. Indexed refs avoid duplicate model registrations. The model projection now updates its aspect ratio on resize.
- The rail is hidden below 1000px. Anchors remain usable through URLs. Keyboard activation moves focus to the target section; scroll tracking uses the viewport's reading position.
- Browser checks covered narrow mobile, intermediate/tablet, and desktop layouts, including wrapped contact URLs and chips. No horizontal overflow was observed. Section backgrounds are transparent so the fixed 3D scene remains visible while scrolling.
- Confirmed link activation, keyboard Enter activation, target focus, and active rail updates in the browser. Existing models rendered alongside desktop text.
- Reduced-motion behavior was verified in source: navigation uses immediate scrolling, CSS transitions and animations are disabled, icon idle rotation and camera entrance easing are disabled. OS-level reduced-motion emulation was not available in the browser tool.
- Lint and production build pass. Existing warnings remain for hook dependencies in Cursor, CameraEffects, and Cone, outdated Browserslist data, and the cannon package's optional worker_threads resolution.
- The existing interactive physics scene remains active, including under reduced motion; this refresh does not redesign or replace it. Real-device sensor/gravity interactions were not tested.

## Visual refinement: terminal accents and section symbols

- Kept the blinking terminal-style heading underscore only on Say hello. Development and design headings have no cursor. Reduced motion keeps the contact cursor static.
- Split section headings into a white opening and a blue-to-green final word.
- Restored the center-line section markers with shared code, design, and envelope SVG symbols.
- Added the same symbols to the left rail. Its active vertical track now sits below the current entry and fills with reading progress until the next section.

- Removed the opaque section backgrounds after visual review: the resized text columns must not clip or conceal the background models.

- Removed circular borders and halos from section symbols. Both marker and rail symbols use SVG blue-to-green stroke gradients with distinct IDs; heading label numbers use the gradient’s blue starting color.

- Extended the active rail progress track across the entire space to the next entry. Rail entries now animate their height and color, with persistent progress elements fading between active sections; reduced motion disables these transitions.

- Redesigned Contact as a responsive grid of six full-area links with keyboard focus and hover feedback. Updated LinkedIn, added Instagram and Wrocław (map link), and preserved the blinking hello cursor.

- Added a stable, server-rendered Home anchor around the opening scene, including keyboard focus, a home symbol, and progress tracking to Development.

- Fixed clipped heading descenders by extending the gradient text painting area. Enlarged skill chips to 15px text with more padding and blue-to-green borders.

## Separate Front-end, Interactive 3D and UX/UI sections

By user request, the page order is now Home → Front-end → 3D / Interactive →
UX/UI Design → Contact. Interactive rendering and modeling skills moved out of
Front-end and the former combined Design section into Interactive 3D; UX/UI
retains its own interface design skills and copy. Both Interactive 3D and UX/UI
currently reuse the existing monkey model (`icon3.glb`), pending a dedicated UX/UI
model. Contact keeps its existing model. Section markers, numbering, navigation,
footer links and timeline tracks include the additional section. Existing
`#design` links still target UX/UI; the new section uses `#interactive`.
No browser automation, tests or build were run, following the user's preference.
