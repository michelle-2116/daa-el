---
name: ColdChain AI Design System
description: A clean, high-clarity visual system for medical logistics and thermal monitoring
colors:
  primary: "#1E3A8A"
  primary-hover: "#172554"
  primary-light: "#EFF6FF"
  neutral-bg: "#F8FAFC"
  neutral-card: "#FFFFFF"
  neutral-border: "#E2E8F0"
  neutral-ink: "#0F172A"
  neutral-muted: "#64748B"
  danger: "#EF4444"
  warning: "#F59E0B"
  success: "#10B981"
  brand-neonBlue: "#0EA5E9"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-card}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-container:
    backgroundColor: "{colors.neutral-card}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: ColdChain AI

## 1. Overview

**Creative North Star: "The Clinical Shield"**

The Clinical Shield design system prioritizes clinical blue/gray clarity, sterile surfaces, and surgical precision. Built specifically for vaccine logistics operators and fleet dispatchers, this interface focuses heavily on content delivery, high readability under varying lighting conditions, and clean scannability. 

This visual system explicitly rejects overstimulating dark modes with chaotic glowing accents, neon gradients, and heavy glassmorphic blurs. Spacing is tight but structured, grids are aligned to strict horizontal/vertical lines, and all visual styling is subservient to data clarity.

**Key Characteristics:**
- High contrast, clinical light-mode styling
- Rigid 8px layout grid with clear divider lines
- Strict typography hierarchy using a single robust geometric sans-serif family
- Refined, flat-by-default interactive elements

## 2. Colors

The color palette is focused on clean, medical-grade slate-grays and surgical blues, with bright solid semantic indicators for system status.

### Primary
- **Surgical Blue** (#1E3A8A): Used for primary branding elements, primary interactive buttons, and strong visual anchors.
- **Deep Navy** (#172554): The hover state for primary elements.

### Neutral
- **Sterile Base** (#F8FAFC): The main background color for the application viewport.
- **Surface Card** (#FFFFFF): Pure white background for content container cards, providing flat visual separation.
- **Divider Slate** (#E2E8F0): Used for all borders, gridlines, and section boundaries.
- **Ink Primary** (#0F172A): Extremely high-contrast slate-black for all primary text and critical figures.
- **Ink Muted** (#64748B): Slate-gray for secondary typography, metadata labels, and captions.

### Named Rules
**The Rarity of Color Rule.** The primary brand blue and functional status colors (red, amber, green) must occupy less than 10% of any viewport. If a screen feels colorful, it is failing. Color is reserved strictly for interactive actions or immediate status alerts.

## 3. Typography

**Display Font:** Inter (sans-serif)
**Body Font:** Inter (sans-serif)
**Label/Mono Font:** Courier New (monospace)

**Character:** Standard geometric utility. Relying entirely on a single highly legible sans-serif font family in varied weights and sizes to convey hierarchy without adding decorative clutter.

### Hierarchy
- **Display** (Bold (700), clamp(2rem, 5vw, 3rem), 1.1): Used for hero metrics, large numbers, and viewport headers.
- **Headline** (Bold (700), 1.875rem, 1.25): Used for main card or section headers.
- **Title** (Semi-Bold (600), 1.25rem, 1.5): Used for sub-sections and component headers.
- **Body** (Regular (400), 0.875rem, 1.5): Used for paragraph content, telemetry values, and descriptions. Maximum line length is capped at 70ch.
- **Label** (Medium (500), 0.75rem, uppercase, letter-spacing 0.05em): Used for section eyebrows, table headers, and status tags.

### Named Rules
**The Strict Alignment Rule.** All numerical telemetry, logs, and coordinate displays must use the monospace font family to prevent alignment shifting and character jitter.

## 4. Elevation

The Clinical Shield rejects heavy drop shadows, floating layers, and depth theater. Depth is communicated strictly through background color contrast and thin border outlines.

### Shadow Vocabulary
- **Interactive Focus** (`box-shadow: 0 0 0 2px #EFF6FF, 0 0 0 4px #1E3A8A`): Used exclusively to highlight focused elements for keyboard navigation.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are completely flat at rest. Card containers rely on thin borders (#E2E8F0) and background contrast, never drop shadows, to define boundaries.

## 5. Components

All components are designed with a restrained and medical aesthetic.

### Buttons
- **Shape:** Medium-rounded corners (8px radius)
- **Primary:** Surgical Blue (#1E3A8A) background with Ink Primary text, internal padding of 8px vertical and 16px horizontal.
- **Hover / Focus:** Transitions smoothly (0.15s) to Deep Navy (#172554) on hover, with a 2px blue focus ring on focus.

### Cards / Containers
- **Corner Style:** Large-rounded corners (12px radius)
- **Background:** Surface Card (#FFFFFF)
- **Shadow Strategy:** No drop shadows.
- **Border:** Thin solid border (#E2E8F0)
- **Internal Padding:** Large layout padding (24px)

### Inputs / Fields
- **Style:** Sterile Base (#F8FAFC) background with a thin solid border (#E2E8F0) and medium-rounded corners (8px).
- **Focus:** Border transitions to Surgical Blue (#1E3A8A) with an outline glow.

### Navigation
- **Style:** Clean side-bar navigation with vertical tabs. Active tab features a clean left-aligned accent bar of 2px width.

## 6. Do's and Don'ts

### Do:
- **Do** maintain a strict 4.5:1 text-to-background contrast ratio for all secondary and muted labels.
- **Do** structure data tables with rigid slate-gray grid lines (#E2E8F0) for maximum alignment.
- **Do** use uppercase label styling with tracked letter-spacing (0.05em) for all table and section headers.

### Don't:
- **Don't** use gimmicky consumer-facing interfaces with excessive decorative elements, large playful illustrations, or overly rounded corners (greater than 12px).
- **Don't** use side-stripe borders greater than 2px to denote callouts or alerts.
- **Don't** pair borders with heavy drop shadows (blur greater than 8px) on the same container card.
- **Don't** use dark-mode gradients, glassmorphism, or neon glowing status indicators.
