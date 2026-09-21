# Design QA

- source visual truth: `design-source.png` (selected first generated concept)
- implementation: `http://127.0.0.1:4182/` in the Codex in-app browser, iPhone preview
- source pixels: 853 x 1844
- implementation: iPhone device screen rendered in the mobile runtime; screenshot inspected at the in-app browser viewport, with the app content scaled by the protected phone frame
- state: Today landing screen, then article detail, Projects, Project detail, Saved empty and populated filters
- density normalization: compared the app content region and composition rather than the surrounding device frame; the source concept is a mobile app screen and the device frame is runtime-owned

## Comparison evidence

The selected source and the rendered implementation were inspected together across the same primary state. The implementation carries over the warm ivory surface, Song-style editorial display type, orange accent rule and CTA, left numbered story list, hero textile image, and three-tab navigation. The runtime-owned iPhone frame, status bar, and home indicator remain outside the app-owned comparison region.

Focused checks covered the masthead and date area, the hero image crop, story row dividers and numbering, the orange primary action, the detail reading hierarchy, the project analysis sections, and the Saved state chips.

## Primary interactions tested

- Opened Today and entered the first article through `开始阅读`.
- Marked the first article read and confirmed the flow advanced to `今日精选 2 / 15` and showed `已读 1/15`.
- Returned to the shell and opened 项目.
- Opened a project, saved the complete analysis, changed its status to `准备验证`, and confirmed the status appeared in the project list.
- Opened 收藏, switched to `待筛选`, and confirmed the empty state appeared for that category.
- Verified the project detail contains the note editor, status sheet, evidence notice, risks, and next-step suggestion.

## Fidelity review

- Fonts and typography: passed. Display hierarchy uses Song-style Chinese fallbacks; body copy and labels use readable system sans sizing.
- Spacing and layout rhythm: passed. Editorial margins, numbered rows, thin rules, and detail sections preserve the source's quiet vertical rhythm. The third story continues below the viewport as expected for a scrollable mobile screen.
- Colors and visual tokens: passed. Warm ivory, ink, muted gray, and restrained orange are consistent across Today, Projects, and Saved.
- Image quality and asset fidelity: passed. The generated textile-and-metal hero asset is used in the hero and detail screens; no CSS or placeholder image is used.
- Copy and content: passed for prototype scope. All feed and project content is explicitly marked as `示例内容`; the UI explains that real sources, competitors, push delivery, and market evidence are not connected yet.

## Findings

No actionable P0, P1, or P2 findings remain for the selected prototype scope. The visual source is a concept mock and does not define the full project and saved screens, so those screens extend the same visual system while keeping the requested core workflow usable.

## Follow-up polish

- Replace demonstration stories and project evidence with live source-backed content.
- Add iOS notification permission flow and scheduled local or server-backed delivery.
- Persist saved projects and notes beyond the prototype session.

final result: passed

## Live feed and notification backend review

The App now reads `src/data/daily-feed.json`; the collector in `scripts/update-daily-feed.mjs` fetches curated RSS/Atom sources, removes duplicate links, keeps source URLs and dates, and falls back to the 15 demo rows when sources are unavailable. `.github/workflows/daily-feed.yml` covers the weekday 07:40 Europe/Rome schedule across CET/CEST and can deploy the built site to GitHub Pages. The optional `push-server` stores one user's Web Push subscriptions and sends a daily payload after the feed job. The remaining deployment dependency is the user's GitHub repository and push-server environment values; local preview does not claim that iPhone notifications are active.

## Daily hero and app identity review

The fixed Today hero has been replaced by a weekday banner selected by the daily feed update. Seven editorial still lifes map to Sunday through Saturday in Europe/Rome, and the selected Chinese weekday label is rendered clearly on top of the background. The current daily image is reused on the matching article detail. A generated square app icon is wired into the favicon, Apple touch icon, web manifest, and notification payload. The previous fixed hero remains only as an unused legacy asset and is no longer rendered by the active route.

## Daily fable review

The fourth bottom tab is a dedicated daily fable section. Each calendar day selects a different graduate-level concept from `src/data/daily-fables.json`; the page presents the allegory first, then reveals the concept near the end, followed by a formal explanation and a practical observation prompt.

## Interaction revision

The prototype now separates the three actions clearly: reading records progress only, every article has a manual 收藏 action, and 收藏 is the user's collection. The 项目 tab is now a weekly optimization shortlist and only displays saved articles moved to `准备优化` from 收藏. This revision was manually verified by saving an article, moving it to `准备优化`, and confirming it appeared in 项目 while the reading count remained independent.

## Navigation and next-step revision

The three root tabs now live in a shared tab shell. Moving toward a later tab animates from the right; moving back toward an earlier tab animates from the left. The bar is fixed to the bottom safe area used by the iPhone preview, with the home-indicator region kept in the same paper background. The selected project detail now presents three suggested next steps: validate the problem, compare three real competitors, and make a minimum sample for feedback.

## Content freshness review

The prototype currently uses explicitly labeled example stories and does not yet fetch live sources. The visible date is now generated from the device date, while the feed itself remains a deliberate demo state until a source collector, deduplication, Chinese summarization, source links, and the weekday 07:40 scheduler are connected. The three weekly project templates now have separate step sets tailored to apparel content service, design workflow tooling, and cross-market localization.
