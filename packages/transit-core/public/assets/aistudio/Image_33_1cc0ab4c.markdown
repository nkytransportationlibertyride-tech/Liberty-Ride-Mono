---
name: Liberty Ride NKY
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5c6300'
  on-secondary: '#ffffff'
  secondary-container: '#daeb14'
  on-secondary-container: '#606800'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1a'
  on-tertiary-container: '#868381'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#dded1a'
  secondary-fixed-dim: '#c2d000'
  on-secondary-fixed: '#1b1d00'
  on-secondary-fixed-variant: '#454b00'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  numeric-fare:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.02em
  numeric-eta:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-utility, precision-first mobility interface engineered for regional transit operations in Erlanger, Northern Kentucky, and the greater Cincinnati metropolitan corridor. The system channels the operational clarity, functional speed, and spatial efficiency of Tier-1 on-demand logistics platforms while maintaining a completely neutral, proprietary visual language.

### Brand Personality & Aesthetic Values
- **Operational Purity:** Utilitarian, immediate, and free from superficial decoration. Every layout, affordance, and label serves the user’s instantaneous goal: dispatch, real-time location confirmation, fare verification, and trip execution.
- **Civic Reliability:** Clean, authoritative, and dependable. The interface evokes steady professionalism, local trustworthiness, and high functional clarity.
- **Zero Decorative Overhead:** Strictly no gradients, no skeuomorphic lighting, and no whimsical or abstract illustrations. Information hierarchy is communicated exclusively through deliberate typographic scales, disciplined whitespace, crisp surface tiers, and explicit geometry.

### Visual Style
- **Disciplined Functional Modernism:** Pure white base canvases, deep carbon typography, high-contrast monochrome buttons, neutral slate containment layers, and strict semantic color containment. 
- **Voice & Tone:** Direct, concise, functional American English. Trip states, system communications, and receipts must be plainspoken, immediate, and unambiguous. All phone-related contact channels must strictly format support contacts as `+1 (859) 537-1827`. All trip timestamps, ETAs, and scheduling intervals must be explicitly presented in Eastern Time (`America/New_York`) with visible timezone labels (e.g., `4:45 PM EDT` or `8:15 AM EST`).

## Colors

The palette is engineered around high luminance contrast to ensure effortless outdoor daylight readability and clear information triage. The palette enforces absolute functional isolation: color is never applied decoratively.

### Core Swatches & Token Mapping
- **Canvas Base (`#FFFFFF`):** Pure white default background for all primary screens, sheet modals, and top-level pages.
- **Text & Primary Action (`#111111`):** Deep carbon black. Applied to primary headline text, prominent body copy, solid interactive primary pill buttons, selected segment indicators, and map pickup/dropoff markers.
- **Secondary Surfaces (`#F2F2F2`):** Light neutral gray. Applied to card containers, text input backings, pill badge surfaces, secondary action buttons, bottom sheet trays, and map control clusters.
- **Border & Dividers (`#E5E5E5`):** Subtle structural divider lines for card segments, ride option rows, table borders, and modal dividers.
- **Secondary Muted Text (`#757575`):** Subdued label text, ETA time descriptions, auxiliary metadata, placeholder text, and inactive tab labels.
- **Accent Yellow-Green (`#D6E608`):** Reserved exclusively for confirmed, completed, active-in-progress, and successful operational states (e.g., "Driver Confirmed", "Payment Successful", "Ride In Progress", active trip path traces, and success pill indicator dots). It is strictly forbidden to use this accent for marketing banners, non-trip accents, or primary interaction buttons.
- **Destructive / Error Red (`#E11900`):** Reserved for ride cancellation alerts, card failure warnings, connection drop notifications, and input error outlines.
- **Attention Amber (`#FFC043`):** Reserved exclusively for cautionary dispatch alerts, high-demand wait time warnings, and driver rerouting notices.

## Typography

The typographic hierarchy utilizes `Inter` across all platforms (falling back gracefully to system sans-serif `SF Pro`, `Roboto`, or `Segoe UI`). It is tuned for glanceability during rapid motion and varying transit lighting conditions.

### Rules of Usage
- **Strict Tabular Numbers:** Fare figures, vehicle license plates, arrival times, and telephone numbers must render with tabular numerals (`font-feature-settings: 'tnum' 1`) to eliminate layout jitter during dynamic updates.
- **Time Representation:** Every displayed timestamp must be localized to Eastern Time (`America/New_York`) with explicit indicators: e.g., `Pickup at 03:15 PM EDT` or `Dropoff approx. 03:42 PM EDT`.
- **Fares & Metrics:** Total prices must lead with standard American currency format: `$24.50`, `$112.00`. Fares must never hide cents on rideshare options unless rounded fixed flat-rates are configured.
- **Telephone Links:** Contact numbers displayed in support or driver panels must follow American standard formatting: `+1 (859) 537-1827`.

## Layout & Spacing

The layout is grounded on a rigorous **8-pixel incremental spatial grid** (with a secondary 4px micro-increment for compact badges, status dots, and border offsets). 

### Layout Model & Viewports
- **Mobile First Transit Canvas (<= 640px):**
  - Outer margins: `16px` (`margin`).
  - Sheet peek heights: minimum `140px` for bottom summary bars; expands dynamically to `60%` or `92%` of screen height.
  - Interactive touch area: minimum `48px x 48px` absolute boundary for every button, sheet drag handle, map overlay icon, and navigation trigger.
- **Tablet / Split View (641px - 1024px):**
  - Two-pane structural composition: Persistent interactive map canvas (`60%` width) paired with a persistent left-docked transit sheet (`40%` width, minimum `380px`).
  - Margins: `24px`. Gutters: `16px`.
- **Desktop Dispatch & Account Hub (> 1024px):**
  - Centered administrative and trip tracking container capped at `1280px` maximum width.
  - Margins: `32px`. Column gaps: `24px`.

### Spacing Tokens
- `space-xs` (4px): Inline padding between status dot and text inside pills; icon-to-label gaps.
- `space-sm` (8px): Distance between form label and text input; gap between fare rows.
- `space-md` (16px): Internal padding inside cards, list item gutters, input vertical/horizontal padding.
- `space-lg` (24px): Vertical spacing between content modules; modal internal margin.
- `space-xl` (32px): Primary section stack offset on desktop viewports.

## Elevation & Depth

To maintain visual clarity, the design system avoids heavy shadows and decorative drop blurs. Depth is achieved via **tonal layering and flat physical boundaries**.

### Surface Hierarchy
1. **Layer 0 (Canvas Base):** Pure `#FFFFFF` canvas or active interactive vector map tiles.
2. **Layer 1 (Card & Grouping Containers):** Solid `#F2F2F2` flat surface containers. Zero shadow. Sharp definition through strict contrast against Layer 0 or segmented with `#E5E5E5` hairline borders.
3. **Layer 2 (Overlays, Floating Action Buttons & Map Controls):** Solid `#FFFFFF` surfaces with a crisp, low-spread ambient boundary shadow:
   - `box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)`
   - Used exclusively for map locator buttons, back arrows, and search bar overlay headers.
4. **Layer 3 (Bottom Sheets & Slide-up Modals):** Pure `#FFFFFF` surface sheet pinned to bottom viewports, separated by a top border hairline (`1px solid #E5E5E5`) and an ambient containment shadow:
   - `box-shadow: 0px -4px 16px rgba(0, 0, 0, 0.06)`

### Rules
- No colored shadows.
- No blurry glassmorphism or translucent backdrop filters.
- Backgrounds behind open modals utilize a flat 40% neutral dimming mask: `rgba(0, 0, 0, 0.40)`.

## Shapes

The interface balances sharp architectural utility with ergonomic physical targets through two distinct radius paradigms:

### Border Radius Application
- **Pill Geometry (`9999px` / Full Radius):**
  - Applied to **all primary interactive buttons**, secondary action buttons, text input search capsules, status indicator badges, and active filter tabs.
  - Guarantees immediate affordance identification and touch confidence.
- **Card Geometry (`12px` / Fixed Standard):**
  - Applied to all structured vehicle selection cards, driver profile cards, fare summary sheets, payment method rows, and dialog modules.
- **Sheet Geometry (`16px` Top Radius):**
  - Applied exclusively to the top-left and top-right corners of expanding bottom sheets.
- **Micro Affordances (`4px` - `6px`):**
  - Checkboxes, status dot shapes, and inline verification code boxes.

## Components

### 1. Buttons
- **Primary Action (Dispatch / Confirm / Book):**
  - Style: Solid `#111111` pill (`border-radius: 9999px`) with `#FFFFFF` text (`label-lg`). Minimum height: `52px` (surpassing the 48px touch minimum). Full-width (`100%`) within sheet contexts.
  - Hover / Focus: `#262626`. Active / Pressed: `#404040`.
  - Disabled: `#E5E5E5` background with `#8E8E93` text.
- **Secondary Action (Cancel / Add Stop / Details):**
  - Style: Solid `#F2F2F2` pill with `#111111` text. Minimum height: `48px`.
  - Hover / Pressed: `#E5E5E5`.
- **Text / Tertiary Action:**
  - Pure `#111111` text link with an explicit hit target padding of `12px 16px` to maintain `48px` minimum touch clearance.

### 2. Status Pills & Badges
- **Architecture:** Compact capsule (`border-radius: 9999px`), background color `#F2F2F2`, height `28px`, padding `0 12px`.
- **Composition:** A colored circular dot (`size: 8px`, `border-radius: 50%`) positioned on the left with `6px` space to the text label (`label-sm`).
- **State Tokens:**
  - **Confirmed / In Progress:** Dot color `#D6E608` (accent yellow-green). Text: "DRIVER EN ROUTE", "TRIP CONFIRMED", "COMPLETED".
  - **Scheduled / Pending:** Dot color `#FFC043` (attention amber). Text: "SEARCHING", "SCHEDULED".
  - **Canceled / Critical:** Dot color `#E11900` (destructive red). Text: "CANCELED", "UNAVAILABLE".

### 3. Cards & Vehicle Option Selectors
- **Container:** `12px` border radius, `#F2F2F2` fill, `16px` internal padding (`space-md`). 
- **States:**
  - Unselected: `#F2F2F2` background, no border.
  - Selected: `#FFFFFF` background, solid `2px` border in `#111111`, ambient Layer 2 elevation.
- **Internal Hierarchy:** Vehicle category name (`headline-sm`), capacity indicator, ETA in Eastern Time (`numeric-eta`), and localized currency fare (`numeric-fare`).

### 4. Input Fields
- **Container:** Minimum height `50px`, fully rounded pill (`border-radius: 9999px`) for quick destination inputs; `12px` radius for multi-line booking forms.
- **Background:** `#F2F2F2` fill. Border: `1px solid transparent`.
- **Focus State:** Background transitions to `#FFFFFF`, border becomes `2px solid #111111`.
- **Error State:** Border becomes `2px solid #E11900`, accompanied by helper error text in `body-sm` red.
- **Pickup & Destination Anchors:** Pickup input preceded by an `8px` black dot; destination input preceded by an `8px` black square, connected vertically by a `2px` dotted line (`#757575`).

### 5. Lists & Rows
- **Trip History & Location Search:**
  - Item height: minimum `56px`.
  - Icon container: `40px` circular `#F2F2F2` background with solid `#111111` icon.
  - Bottom boundary: `1px solid #E5E5E5` hairline border spanning from content margin to edge.

### 6. Empty & Error States
- **Design Rule:** Completely empty or broken views are strictly prohibited. Every non-ideal state must present clear context and a direct resolution button.
- **Empty State (e.g., No Past Trips):**
  - Centered layout, generous top/bottom padding (`space-xl`).
  - Title in `headline-md` ("No trips yet").
  - Description in `body-md` muted ("When you ride with Liberty Ride NKY, your trip receipts and details will appear here.").
  - Action: Primary black pill button ("Book a Ride", minimum 48px height).
- **Error State (e.g., Dispatch Connection Failed):**
  - Title in `headline-md` ("Unable to connect").
  - Description in `body-md` muted ("We couldn't confirm ride availability in Erlanger, KY. Please check your data connection or call +1 (859) 537-1827.").
  - Action: Primary black pill button ("Retry") accompanied by a secondary pill button ("Call Dispatch").