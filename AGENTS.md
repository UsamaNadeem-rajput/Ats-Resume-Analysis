# UI design rules

PROJECT PATHS
- The React frontend is my-app/ (source in my-app/src). There is no client/ folder. If one appears, it is an accidental copy: do not use or create it.
- Work in place on the git branch ui-design. Never copy, duplicate, rename or back up any folder or file. Do not create files like Login2.jsx or Login.new.jsx.

SCOPE
Change the UI only. Do NOT change existing logic: API calls, axios services, Context (AuthContext), routes and guards, hooks, validation, state shape, or anything in server/.
If the design needs something missing (a state, message, animation, component), add it. Do not remove or rewrite what already works. If a design behaviour conflicts with existing logic, keep the logic and tell me.

SOURCE OF TRUTH
Looks: design/pages/<page>.html and design/DESIGN.md. Copy text, spacing, colours and animations exactly. Never redesign or "improve".

READING THE HTML
- Contents of <x-dc> are the page body. <helmet> holds fonts, CSS and helper scripts. Ignore support.js, data-dc-script and the Component class.
- "Preview state" radio switchers are design-review only. Do not ship them. Use the real state of the page.

SHARED COMPONENTS
- MeasuringTape, Navbar, Footer, Button, Chip, ScoreBadge, ConfirmDialog, Toast, EmptyState, ErrorState, Skeleton and Tooltip exist ONCE in my-app/src/components. Pages must import them. Never paste their markup or CSS into a page, even though each page HTML contains its own copy.
- If a page needs a missing variant, add a prop to the existing component. Do not create a second component.

STYLING
Use the project's existing styling method. If none, plain CSS with variables from DESIGN.md. No new UI libraries or icon packages (icons are inline SVG as in the HTML).

BEHAVIOUR
Every interaction in the HTML must fire on the same trigger: show/hide password, live counters, disabled submit until valid, tooltips on hover and focus, details menus, tabs, copy ("Copied"), dialogs, toasts, skeletons, drag-drop upload, load and fill animations. prefers-reduced-motion turns animation off.

CHECK
Compare the page with its HTML at 1440 and 360 in the browser, fix every difference, and list anything that does not match. Never claim an exact match without comparing.

DESIGN-ONLY CONTENT (never render in the app)
The design HTML files contain notes written for the designer, not for users. Do NOT copy them into the app. They include:
- Any dashed box or section titled "States used on this page", "If the log in fails", "If the form is sent back", "If something does not match", "Preview state", or similar, and the paragraphs that explain behaviour ("The button turns on when...", "One message for both cases...").
- Labels such as "Sample data" or "SAMPLE" on app pages (but NOT on the Landing page sample card, which is real marketing content).
- Static galleries of states (buttons normal/loading/disabled, error boxes, counters, empty/error examples shown side by side).
- design/pages/tape-component.html is documentation. Build only the MeasuringTape component from it. Do not create a page or route for it.

Those samples show what the UI looks like in a situation. Implement them as real states that appear ONLY when the situation happens:
- an error box appears only after a failed request or failed validation
- a loading spinner and skeleton appear only while loading
- an empty state appears only when the list is empty
- a toast appears only after its action
- a dialog opens only after its trigger
- a disabled button is disabled only while its condition is not met
Keep existing logic for when these happen. Only style them like the sample. If a state has no existing trigger in the code, add the minimum state needed and tell me.
If you are unsure whether a block is design-only, do not render it and ask me.

MEASURING TAPE RULES

ONE COMPONENT
- MeasuringTape exists once: my-app/src/components/MeasuringTape. It is the only code that draws a tape (ticks, labels, marker, caption, strip).
- It is rendered in ONE place only: the shared page wrapper (PageShell). If the app already has a layout component (AppLayout, PublicLayout), use it as PageShell. Pages never render MeasuringTape directly and never draw their own ruler (no SVG ticks, no CSS gradient ruler, no copy from the HTML).
- Each page passes only a config: <PageShell tape={{ variant, ... }}>. Read values from the page's existing state and validation. Do not add new validation or change logic.
- Do not copy the tape markup from design/pages/*.html. Build it once from design/pages/tape-component.html.

SCALE AND POSITION (always computed, never hard-coded)
- Scale is 0 to 100. Full tape viewBox "-10 0 1020 74": tick x = n * 10; minor tick every 1 (12 tall), major every 5 (22 tall); labels every 10 at y=44, DM Mono 13.
- Compact tape (below 600px, chosen by the component itself, never by a page): viewBox "-12 0 424 80", x = n * 4; labels every 25, DM Mono 15.
- Marker x = clamp(value, 0, 100) * 10 (compact: * 4). Triangle: points x,54 x-10,70 x+10,70 (compact: x,56 x-8,72 x+8,72).
- Marker colour by value: 0-39 #B3261E, 40-69 #B45309, 70-100 #1F7A4D. Progress and position use accent #B83A16. outOfRange uses #B3261E.

CHROME (identical on every page)
- Strip: full-width background #F6F8FA, 2px ink bottom border, sits above the navbar. Inner width equals the page container (max-width 1200px, side padding clamp(20px, 5vw, 56px)), padding 18px top and 14px bottom.
- The SVG is aria-hidden. The caption under it is real text, DM Mono 12px, uppercase, letter-spacing .1em, 12px below the tape, coloured like the marker. The caption carries the information for screen readers. Use aria-live="polite" when it can change.

VARIANTS AND WHERE THEY ARE USED
| Page | variant | value | caption |
| Landing | score | 72 (fixed sample) | Sample score: 72 / 100 |
| Register | progress, total 4 | fields currently valid: name, email, password, confirm | N of 4 measurements |
| Login | progress, total 2 | email filled, password filled | N of 2 measurements |
| NewAnalysis | progress, total 3 | resume valid, job title filled, description 100-8000 chars | N of 3 measurements |
| Result, AI Suggestions, Cover Letter | score | the analysis score | ✓ Score: 72 / 100 · Good (or ~ Fair, ✕ Weak) |
| Dashboard | compare | value = latest score, compareValue = best of last 10 | ▲ Latest: 72 · △ Best of last 10: 86 |
| History | position | (page - 1) / (totalPages - 1) * 100 (0 if one page) | Page 2 of 5 |
| Settings | base (no marker) | none | Settings |
| 404 | outOfRange | none | ✕ Out of range |
progress value = done / total * 100. compare with no compareValue or equal values shows one marker.
Loading: base, caption "Measuring...", no marker. When data arrives the marker slides in.
Empty or error (no analyses, analysis not found): base, caption "No analyses yet" or "Not found".

MOTION (same for every variant)
- On mount the tape unrolls: tick marks reveal left to right in 0.9s ease-out, labels fade in.
- Then the marker slides from 0 to its value in 1.8s cubic-bezier(.2,.8,.2,1) with 0.2s delay.
- When the value changes later (typing in a form, changing page) the marker moves in 0.5s with the same easing.
- outOfRange: the marker slides past the end and stops beyond the last tick.
- prefers-reduced-motion: no animation, marker placed at its final position.

CHECKS
- git grep -n "<MeasuringTape" my-app/src must show only PageShell (and the dev-only /_kit page).
- git grep -n 'viewBox="-10 0 1020' my-app/src must show only MeasuringTape.
If a page needs something this table does not cover, ask me before inventing a variant.

PAGES THAT DO NOT EXIST YET (build the full page: UI and logic)
This section overrides "SCOPE: UI only", but ONLY for pages with no file yet in my-app/src. Pages that already exist stay UI-only.

SOURCES, in this order
1. Behaviour and logic: design/SPEC.md (Phase 11 spec): fields, rules, buttons, messages, states, redirects, route guards.
2. Look: design/pages/<file>.html and design/DESIGN.md, plus the DESIGN-ONLY CONTENT and MEASURING TAPE RULES above.
3. Backend: read server/ (routes, controllers, models, middleware) to find the real method, path, request body and response shape. Never guess an endpoint.

HOW
- Follow the project's existing patterns: the existing axios instance or services, AuthContext, route guards, toast mechanism, folder layout and naming. If a needed piece is missing (for example no axios instance), tell me before creating it.
- No mock data. Call the real backend.
- Do not edit server/. If the backend lacks something the spec needs (for example GET /auth/me, a field that is not saved, a missing route), do not add it. Describe the gap, make the frontend work with what exists, and list it for me.
- If spec and backend disagree, follow the backend and tell me. If design and spec disagree, follow the design HTML for looks and the spec for behaviour.
- Use the spec's exact English messages. 401 on any request: end the session, go to /login, toast "Your session has expired. Please log in again." 429: "Too many requests. Please wait a minute."
- Do not modify existing pages or shared components, except adding a prop to a shared component when a variant is missing.