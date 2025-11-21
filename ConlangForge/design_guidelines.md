# Conlang Generator - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Modern Productivity Application
**References:** Linear (clean data density), Notion (flexible content organization), GitHub (technical documentation clarity)
**Justification:** This is a utility-focused, information-dense application requiring clear hierarchy, efficient workflows, and complex data visualization. A systematic approach ensures consistency across multiple features (forms, trees, dashboards, chat, PDF views).

## Core Design Elements

### Typography
- **Primary Font:** Inter or 'Public Sans' (Google Fonts) - excellent for UI and data display
- **Monospace Font:** 'JetBrains Mono' or 'Roboto Mono' - for linguistic examples, phonetic notation
- **Hierarchy:**
  - Page titles: text-3xl font-bold
  - Section headings: text-xl font-semibold  
  - Card titles: text-lg font-medium
  - Body text: text-base font-normal
  - Captions/metadata: text-sm
  - Linguistic notation: text-sm font-mono

### Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Container margins: mx-4, mx-6, mx-8

**Grid Strategy:**
- Dashboard/Language List: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6
- Language Detail Sections: Two-column layout (lg:grid-cols-2) for grammar rules, vocabulary sections
- Forms: Single column max-w-2xl for creation flow, two-column (lg:grid-cols-2) for influence selection

### Component Library

**Navigation:**
- Top navigation bar with logo, main sections (Dashboard, Create, Tree View), user profile
- Sidebar for language detail pages: collapsible navigation showing language sections (Phonology, Grammar, Vocabulary, etc.)

**Core UI Elements:**

*Language Cards:*
- Rounded borders (rounded-lg), elevation shadow
- Header: Language name + metadata (creation date, parent language indicator)
- Body: Brief stats (vocabulary count, grammar rules count)
- Footer actions: View, Edit, Create Child, Export PDF

*Creation Form:*
- Multi-step wizard interface with progress indicator
- Influence selector: Checkbox grid with language family categories (Romance, Germanic, Sino-Tibetan, etc.)
- Description textarea: Large, prominent field for custom specifications
- Generate button: Primary CTA, centered at form bottom

*Language Tree Visualization:*
- SVG-based interactive tree with nodes and connecting lines
- Node design: Circular or rounded rectangles with language name
- Expandable/collapsible branches
- Zoom/pan controls in corner
- Legend explaining genealogical relationships

*Data Display:*
- Vocabulary table: Searchable/filterable with columns (Word, Translation, Part of Speech, Etymology)
- Grammar rules: Expandable accordion sections with code-style examples
- Syntax patterns: Visual diagrams with labeled components
- Phonology: IPA notation in monospace font with audio playback placeholders

*Chat Interface:*
- Two-column layout: Chat messages (left 60%) + language reference panel (right 40%, collapsible)
- Message bubbles: User vs AI clearly distinguished through positioning and styling
- Input area: Textarea with send button and language toggle (Conlang ↔ English)
- Quick reference cards showing common phrases in sidebar

*PDF Export Preview:*
- Document-style layout with clear sections
- Table of contents navigation
- Typography optimized for reading (larger line-height)
- Download/Print buttons in sticky header

**Forms:**
- Text inputs: Full-width with clear labels above
- Select dropdowns: Native styling with clear visual feedback
- Checkboxes: Grid layout for multiple selections
- Textareas: Auto-expanding, minimum 4 rows
- Submit buttons: Full-width or prominent placement

**Overlays:**
- Confirmation modals: Centered, max-w-md with backdrop blur
- Language deletion warnings: Clear destructive action styling
- Loading states: Skeleton screens for language generation

### Icons
**Library:** Heroicons via CDN
**Usage:**
- Navigation items
- Action buttons (edit, delete, export)
- Tree node indicators (parent/child relationships)
- Form field icons (search, filter)
- Status indicators (generating, complete)

### Animations
**Minimal approach - use only:**
- Smooth transitions on hover states (transition-colors duration-200)
- Tree node expand/collapse (transition-transform)
- Form step transitions (fade in/out)
- Loading spinners during language generation
- No scroll-triggered or decorative animations

## Images
**No hero images needed** - this is a productivity application, not a marketing site.

**Illustrations:**
- Placeholder empty states (when no languages exist yet) with simple SVG illustrations
- Language tree visualization (generated SVG, not static images)

## Application-Specific Layout Patterns

**Dashboard:**
- Welcome header with "Create New Language" primary CTA
- Filter/sort controls (dropdown + search)
- Language cards grid
- Empty state with illustration + create prompt

**Language Detail Page:**
- Header: Language name, parent indicator, action buttons (Edit, Delete, Create Child, Export PDF, Chat)
- Tabbed sections OR vertical scrolling sections: Overview, Phonology, Grammar, Syntax, Vocabulary
- Sidebar navigation for quick jumping between sections

**Tree View:**
- Full-viewport canvas (min-h-screen)
- Floating controls panel (zoom, reset, legend)
- Click nodes to view language details in side panel

**Chat Interface:**
- Full-height container (min-h-screen)
- Fixed header with language name + toggle
- Scrollable message area
- Fixed bottom input area
- Collapsible reference sidebar

## Accessibility
- All interactive elements keyboard navigable
- Focus states clearly visible (ring-2 ring-offset-2)
- Form labels properly associated
- ARIA labels for icon-only buttons
- Semantic HTML structure throughout
- Tree visualization includes keyboard navigation