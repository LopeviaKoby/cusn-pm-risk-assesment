---
version: alpha
name: TIVIT GPL Enterprise Design System
description: A compact, accessible B2B SaaS visual identity with coordinated light and dark themes, calibrated to the GPL design direction.
colors:
  primary: "#E50003"
  secondary: "#003D75"
  tertiary: "#007DF9"
  neutral: "#222629"

  light-primary: "#B70002"
  light-primaryHover: "#890002"
  light-secondary: "#003D75"
  light-accent: "#004B95"
  light-background: "#F8FAFC"
  light-surface: "#FFFFFF"
  light-surfaceHover: "#CCE5FE"
  light-textPrimary: "#141719"
  light-textSecondary: "#222629"
  light-textMuted: "#4E5154"
  light-border: "#D3D4D4"
  light-borderFocus: "#003D75"
  light-danger: "#B70002"
  light-success: "#003D75"
  light-onPrimary: "#CCE5FE"
  light-onSecondary: "#CCE5FE"

  dark-primary: "#F5999A"
  dark-primaryHover: "#FACCCD"
  dark-secondary: "#99B1C8"
  dark-accent: "#66B1FB"
  dark-background: "#070808"
  dark-surface: "#1B1E21"
  dark-surfaceHover: "#222629"
  dark-textPrimary: "#CCE5FE"
  dark-textSecondary: "#99B1C8"
  dark-textMuted: "#A7A8A9"
  dark-border: "#668BAC"
  dark-borderFocus: "#66B1FB"
  dark-danger: "#EF6668"
  dark-success: "#99CBFD"
  dark-onPrimary: "#141719"
  dark-onSecondary: "#141719"

  dark-controlBorder: "#668BAC"
  dark-chartPlanned: "#668BAC"
  dark-chartReal: "#66B1FB"
  dark-neutral-status: "#222629"
  dark-neutral-status-foreground: "#CCE5FE"
  dark-risk-low: "#143A2B"
  dark-risk-low-foreground: "#8FE0B2"
  dark-risk-medium: "#172F49"
  dark-risk-medium-foreground: "#A6CEFF"
  dark-risk-high: "#43361B"
  dark-risk-high-foreground: "#F6D57A"
  dark-risk-critical: "#471F29"
  dark-risk-critical-foreground: "#FFA8B8"
  dark-opportunity-limited: "#2B3035"
  dark-opportunity-limited-foreground: "#C5CBD1"
  dark-opportunity-moderate: "#172F49"
  dark-opportunity-moderate-foreground: "#A6CEFF"
  dark-opportunity-high: "#173A2C"
  dark-opportunity-high-foreground: "#A1DFBA"
  dark-opportunity-very-high: "#20583D"
  dark-opportunity-very-high-foreground: "#C0F3D2"
  dark-progress-behind: "#28324B"
  dark-progress-behind-foreground: "#B9C6FF"

  light-controlBorder: "#7A8793"
  light-chartPlanned: "#668BAC"
  light-chartReal: "#004B95"
  light-neutral-status: "#EEF0F2"
  light-neutral-status-foreground: "#4E5154"
  light-risk-low: "#E8F5EE"
  light-risk-low-foreground: "#14633D"
  light-risk-medium: "#E8F2FF"
  light-risk-medium-foreground: "#174B84"
  light-risk-high: "#FFF2CC"
  light-risk-high-foreground: "#754B00"
  light-risk-critical: "#FDE9EB"
  light-risk-critical-foreground: "#A31832"
  light-opportunity-limited: "#EEF0F2"
  light-opportunity-limited-foreground: "#4E5154"
  light-opportunity-moderate: "#E8F2FF"
  light-opportunity-moderate-foreground: "#174B84"
  light-opportunity-high: "#E8F5EE"
  light-opportunity-high-foreground: "#14633D"
  light-opportunity-very-high: "#CBEAD8"
  light-opportunity-very-high-foreground: "#0B5131"
  light-progress-behind: "#EDEFFD"
  light-progress-behind-foreground: "#394A99"

typography:
  heading-lg:
    fontFamily: Google Sans
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading-md:
    fontFamily: Google Sans
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
  heading-sm:
    fontFamily: Google Sans
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-emphasis:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px

components:
  button-primary-light:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.light-onPrimary}"
    typography: "{typography.body-emphasis}"
    rounded: "{rounded.md}"
  button-primary-light-hover:
    backgroundColor: "{colors.light-primaryHover}"
    textColor: "{colors.light-onPrimary}"
  button-primary-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-onPrimary}"
    typography: "{typography.body-emphasis}"
    rounded: "{rounded.md}"
  button-primary-dark-hover:
    backgroundColor: "{colors.dark-primaryHover}"
    textColor: "{colors.dark-onPrimary}"
  button-secondary-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-textPrimary}"
    typography: "{typography.body-emphasis}"
    rounded: "{rounded.md}"
  button-secondary-dark:
    backgroundColor: "{colors.dark-surfaceHover}"
    textColor: "{colors.dark-textPrimary}"
    typography: "{typography.body-emphasis}"
    rounded: "{rounded.md}"
  input-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-textPrimary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
  input-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-textPrimary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
  navigation-selected-light:
    backgroundColor: "{colors.light-surfaceHover}"
    textColor: "{colors.light-textPrimary}"
    rounded: "{rounded.sm}"
  navigation-selected-dark:
    backgroundColor: "{colors.dark-surfaceHover}"
    textColor: "{colors.dark-textPrimary}"
    rounded: "{rounded.sm}"
  card-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-textPrimary}"
    rounded: "{rounded.lg}"
  card-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-textPrimary}"
    rounded: "{rounded.lg}"
  table-header-light:
    backgroundColor: "{colors.light-surfaceHover}"
    textColor: "{colors.light-textSecondary}"
    typography: "{typography.label}"
  table-header-dark:
    backgroundColor: "{colors.dark-surfaceHover}"
    textColor: "{colors.dark-textSecondary}"
    typography: "{typography.label}"
  button-destructive-light:
    backgroundColor: "{colors.light-danger}"
    textColor: "{colors.light-onPrimary}"
    typography: "{typography.body-emphasis}"
    rounded: "{rounded.md}"
  button-destructive-dark:
    backgroundColor: "{colors.dark-danger}"
    textColor: "{colors.dark-onPrimary}"
    typography: "{typography.body-emphasis}"
    rounded: "{rounded.md}"
  chip-selected-light:
    backgroundColor: "{colors.light-surfaceHover}"
    textColor: "{colors.light-textPrimary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  chip-selected-dark:
    backgroundColor: "{colors.dark-surfaceHover}"
    textColor: "{colors.dark-textPrimary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  tooltip-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-textPrimary}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  tooltip-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-textPrimary}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
---

# GPL Enterprise Design System

## Overview

GPL uses a restrained, high-density enterprise design language for project managers reading tables, reviewing exceptions, and comparing progress. Linear-inspired precision and calm meet Atlassian-inspired structural clarity and predictable controls. The interface should feel like a dependable working console: compact, legible, and composed.

Light is the default from the first render and at every new presentation session. Dark remains an available alternative and is not persisted. Typography, alignment, tonal surfaces, and thin dividers establish hierarchy. The TIVIT/GPL mark retains its original proportions and colors. Product-facing labels and messages are in Spanish.

## Colors

The supplied swatch is authoritative. Its brand anchors are crimson `#E50003`, navy `#003D75`, electric blue `#007DF9`, and charcoal `#222629`. These anchors express brand identity; the `light-*` and `dark-*` tokens express usable semantic roles. **Do not substitute an anchor color for a theme-specific role solely because both look similar.**

**Theme application:** Select one complete token family at a time. In light mode map the application's semantic roles to `light-*`; in dark mode map them to `dark-*`. Components consume roles such as `primary`, `surface`, `textPrimary`, and `borderFocus` through that active theme mapping. Do not independently invert individual color values or mix light-theme text with dark-theme surfaces. Historical references are dark; the default application theme is light. The document root carries the active theme so portals and native controls inherit the same family.

- **Background / surface:** Background establishes the page canvas; surface establishes contained controls and panels; surfaceHover identifies interactive proximity or selection when paired with other cues.
- **Primary / primaryHover:** Filled primary actions only. Their label color comes from the corresponding `onPrimary` token, not from `textPrimary`.
- **Secondary / accent:** Subordinate actions, links, and focus-adjacent emphasis; neither should compete with a local primary action.
- **Text:** `textPrimary` for essential content, `textSecondary` for supportive information, `textMuted` for genuinely subordinate metadata; never use muted text for critical values or instructions.
- **Danger / success:** Preserve the existing danger and blue-toned success roles. The authorized risk/opportunity extension below adds explicit green and amber pairs; use these semantic roles rather than ad hoc colors. Always accompany status color with wording or an accessible value.
- **Border / borderFocus:** 1px structural dividers for ordinary separation; `controlBorder` for essential input outlines; a clearly perceptible focus indicator using `borderFocus` for keyboard navigation. Light structural borders are opaque neutral gray, while selected and hovered controls use the approved pale blue.

### Light structure and semantic extension

Light uses a `#F8FAFC` canvas, white surfaces, `#D3D4D4` structural dividers, `#7A8793` control borders and `#CCE5FE` selection/hover. Dark retains its existing foundation. `chartPlanned` and `chartReal` are independent series roles, so a structural-border change cannot recolor a data series. `divider` preserves the existing dark border mix and uses the opaque structural border in light. The CSS token file and Tailwind/shadcn aliases map these same roles.

Risk scores remain the approved probability/impact scale 1–5 and total 1–25. The following are **provisional presentation bands**, centralized in `src/demo/presentation.ts`; they do not determine approvals, treatment priority or lifecycle rules:

- Threats: 1–4 `risk-low` (green), 5–9 `risk-medium` (blue), 10–14 `risk-high` (amber), 15–25 `risk-critical` (red).
- Opportunities: 1–4 `opportunity-limited` (neutral), 5–9 `opportunity-moderate` (blue), 10–14 `opportunity-high` (green), 15–25 `opportunity-very-high` (stronger green). Increasing opportunity potential never means increasing danger. The subdivision at 15 is provisional presentation, not a business threshold.
- Every role has a background/foreground pair in each theme. `positive` aliases opportunity-high; `review-overdue` aliases the amber pair for attention, while `progress-behind` is independent indigo. Materialization, overdue review, proposal decision and progress deviation are separate dimensions.
- Display a score alone, with the semantic background/text pair and accessible contextual description (for example, “Exposición 12, nivel alto”). Never show multiplication formulas in badges, tables or severity charts. Separate probability/impact fields belong to evaluation/detail views.

Contextual project links preserve the selected project and list filters in the URL. Only implemented project destinations are links; future tabs are identified as unavailable. Proposal decisions require the assigned PM, explicit confirmation and a valid review date. Local session decisions update every derived list and count, do not duplicate an accepted risk or write source JSON, and reset on reload. The detail shows preparation and activation of contingency as separate recorded facts.

Manual project and risk forms use the existing Base UI dialog, labeled fields, two columns on desktop, progressive disclosure for optional data and an explicit discard confirmation. Project master fields are identifier, name, client, manager, country and LOB; the documents identify LOB without prescribing its catalog. The fictional catalog in `src/demo/data/core/catalogs.json` supplies LOB, dependent services, squads, technical leads, complexities and risk categories. Risk category is distinct from impacted domains. Legacy local projects retain their free-text LOB; new forms select catalog references. Service, squad, lead, complexity and P1P2 receipt are optional. Dates and description are optional; no progress, SPI or financial values are fabricated. Manual risks require identification/description, type, responsible person, scope, impacted domains, integer P/I and a compatible strategy. New risks start active; response, trigger, contingency and next review are optional. These required-field and initial-state choices are reversible presentation defaults where the documents do not prescribe an exhaustive validation matrix. Catalogs follow the two source DOCX in `docs/`; contingency preparation never triggers activation.

Local access uses one public fictional account linked to the existing PM; it provides no security boundary. Only a non-sensitive access flag is kept in `sessionStorage` (`gpl.demo.access.v1`); credentials and tokens are never stored there. Manually created mock records use a validated, versioned `localStorage` envelope (`gpl.demo.records.v1`), independent of credentials and of transient AI decisions. The key remains `gpl.demo.records.v1`; envelope version 2 reads versions 1 and 2, validates relationships and upgrades on the next successful save without removing earlier records. Catalog references are optional for legacy records; unclassified local risks remain unclassified. Failed persistence preserves the form. Invalid stored records are rejected with an error; technical reset is `localStorage.removeItem("gpl.demo.records.v1")` followed by reload. No source JSON is modified. Login uses the supplied local logo and building photograph, without recovery, OAuth or inactive controls.

### Business context and financial comparisons

Project summaries keep identity, progress and follow-up primary. LOB, squad and technical lead are visible; commercial roles, service, customer relationship/sector, complexity, P1P2 receipt and SAP/CECO/PEP examples use progressive disclosure. These catalog relationships and commercial references are fictional examples, not recovered legacy records. TCV (total commercial value) and ACV (annual commercial plan) carry independent currency, date, origin and status. The source documents do not establish a total approved operating budget; legacy ambiguous budget values are therefore absent, never derived from commercial or cash-flow references.

Portfolio Finance is a contextual tab, with project, country, currency and monthly period filters in the URL. A single currency is always selected; no FX conversion or cross-currency total is implied. The common selector places each Showpricing original, PM plan and recorded real amount in its own dated month. Null means absent; an explicitly recorded zero stays zero. Comparable difference is the sum of real minus plan only for project/month pairs containing both values; it is not a forecast or the subtraction of totals with different coverage. The table exposes dated origins and invoice references; only an explicit invoice reference supports an issued-invoice label. Purchases retain expected and recorded actual egresos separately from billing, TCV/ACV and operating budget.

Monthly grouped SVG bars reuse chartPlanned/chartReal, with a dashed neutral outline for the original reference, labeled values, units, keyboard/focus readout and the exact alternative table. Legends do not rely on color alone. Finance uses a 160 ms contextual opacity transition with `useReducedMotion`; reduced motion removes that transition. No continuous or numeric animations. Views admit vertical scroll and dense tables/charts preserve local horizontal scrolling.

**Contrast:** Meet WCAG AA: at least 4.5:1 for normal text, 3:1 for large text, and 3:1 for essential non-text indicators. Recheck each component combination in its actual context, including hover, selected, disabled, and status badges. Avoid placing text on vivid brand anchors without verifying its contrast. Distinguish all states beyond hue alone.

## Typography

Use **Google Sans** at weights **600 and 700** for headings; use **Manrope** at weights **400 and 500** for content, table cells, labels, buttons, captions, and dense metadata. Use the named tokens as the source of font size, weight, and line height. Do not generate additional ad hoc type scales for individual screens.

Apply `heading-lg` to major titles, `heading-md` and `heading-sm` to progressively nested sections, `body-md` to normal content and tables, `body-emphasis` to emphasized controls and record labels, `label` to field names and table headers, and `caption` to supporting metadata. Use tabular numerals for metrics, dates, percentages, and aligned numeric columns where available. Do not substitute compressed or tiny text for a layout fix; allow wrapping or scroll where necessary.

If a font is unavailable, retain its intended role and use a neutral system sans-serif fallback that preserves the same hierarchy and reading rhythm.

## Layout

Use a **4px/8px rhythm** with the `spacing` scale. `xxs` and `xs` separate tightly related elements; `sm` and `md` define control and group padding; `lg` and `xl` separate sections; `2xl` and `3xl` are reserved for major structural breathing room. Prefer consistent grid alignment and responsive sizing to arbitrary absolute offsets.

The established language is desktop-first and information-dense. Use horizontal space deliberately, preserve readable names and values, and group related material. Long tables may scroll horizontally on constrained layouts rather than drop essential columns or render illegible text. At narrower widths, stack regions in logical reading order and keep controls keyboard- and touch-accessible. Navigation surfaces, content regions, and secondary panels should share a coherent spacing rhythm.

## Elevation & Depth

Default to **flat tonal layering** and thin 1px borders. Use a softer surface contrast before introducing any shadow. Elevation is reserved for genuinely floating layers such as dropdowns, tooltips, drawers, and dialogs.

If needed, use restrained shadows: light `0 1px 2px rgba(0,12,23,0.08)` for small layers or `0 8px 24px rgba(0,12,23,0.10)` for overlays; dark `0 1px 2px rgba(0,12,23,0.24)` or `0 8px 24px rgba(0,12,23,0.38)` respectively. These provide separation for floating content while leaving the ordinary workspace flat.

## Shapes

Use consistent, disciplined geometry: `rounded.sm` (4px) for compact navigation and small elements, `rounded.md` (8px) for buttons, inputs, dropdowns, and dialogs' controls, `rounded.lg` (12px) for section containers and dialogs, and `rounded.full` only for pills, circular avatars, and badges that require it. Avoid mixing incompatible radii within the same family of components.

## Components

**Theme inheritance:** Every component inherits the active theme's semantic colors and the shared typography, spacing, and radius scales. Component entries in the front matter define reusable examples, not independent themes. States must be consistent across instances.

- **Buttons:** Provide primary, secondary, ghost/tertiary, and destructive treatments. Define resting, hover, keyboard focus, pressed, loading, and disabled appearances. A primary action uses `primary` and `onPrimary`; secondary actions use neutral surfaces and readable text. Destructive fills use `danger` with `onPrimary` from the same theme, as defined in the component tokens. Reserve strong brand emphasis for the current local decision. Disabled controls must remain identifiable, and loading must not masquerade as success.
- **Navigation:** Sidebars, topbars, breadcrumbs, tabs, and secondary navigation share typography, icon alignment, dividers, and active-state styling. Selected items use a background or underline plus textual/iconographic differentiation; do not rely on color alone. Place the authentic PNG brand asset in the brand area without stretching or recoloring it.
- **Inputs and forms:** Use persistent labels, `surface` backgrounds, 1px borders, and `rounded.md` geometry. Text inputs, selects, textareas, checkboxes, radio buttons, date controls, and search fields share the same visual focus language: a solid 2px `borderFocus` outline with 2px separation from the control. Checked and indeterminate marks remain distinct against their fill. Validation uses adjacent helper/error text and must not rely only on red borders. Avoid placeholder-only labels.
- **Tables and lists:** Prefer flat rows over one card per record. Use stable headers, quiet row dividers, restrained selection and hover treatments, and consistent alignment of numbers. Preserve readable row height and distinguish primary cell content from metadata. Empty, loading, selected, and disabled states retain the same visual framework.
- **Cards and metric blocks:** Use containers only to establish meaningful information groups. Keep backgrounds quiet, borders light, and metrics typographically prominent. Do not turn every datum into a colored tile.
- **Badges, chips, and statuses:** Compact labels with explicit wording; `rounded.full` where appropriate. Selected chips use `surfaceHover`, `textPrimary`, and the `label` scale, with a checkmark or other non-color selection cue. Apply restrained theme-specific background/text pairings and check contrast. Separate status, category, severity, and selection semantics instead of assigning a single color to unrelated meanings.
- **Dialogs, drawers, dropdowns, and tooltips:** Use clear surface separation and modest elevation. Keep dismiss/confirm actions visually distinct; ensure keyboard focus is easy to locate. Tooltips use the `caption` scale, `rounded.sm`, and `spacing.xs` padding; they supplement visible labels rather than replacing necessary information. Modal overlays visually subdue, but do not obscure, context.
- **Message surfaces:** If a message interface is required, reuse the same body typography, surfaces, text contrasts, rounded scale, and input/button variants. Distinguish senders through labels, alignment, and restrained tone rather than an unrelated visual system.
- **Charts and progress indicators:** Favor clean axes, readable labels, direct values, restrained series colors, and consistently styled legends and tooltips. Pair every essential color-encoded distinction with a label, key, shape, or direct value. Avoid 3D effects, gradients, decorative animation, and chart-specific one-off palettes.
- **Icons:** Use one coherent outline family, preferably Lucide, typically 16–20px with consistent optical alignment and stroke weight. Icons support labels; critical actions and states must not rely on icons alone.
- **Microinteractions:** Feedback should be brief, subtle, and predictable. Support reduced-motion preferences. Focus, pressed, hover, and progress feedback must never alter layout unexpectedly.

## Do's and Don'ts

- **Do** treat frontmatter values as normative and prose as usage rationale.
- **Do** use one semantic theme mapping and one reusable visual treatment per component state.
- **Do** preserve approved brand colors, type families, spacing, icon style, and image proportions.
- **Do** test contrast and keyboard-visible focus for actual component foreground/background combinations.
- **Do** preserve dense enterprise readability through alignment and deliberate content hierarchy.
- **Don't** introduce colors outside the supplied swatch and the explicitly authorized semantic extension, or use vivid brand anchors as arbitrary status colors.
- **Don't** use shadows for ordinary surface separation; reserve the documented shadows for floating layers.
- **Don't** introduce gradients, glassmorphism, neon, or excessive visual decoration.
- **Don't** hide critical information in tooltips, color alone, hover alone, or tiny typography.
