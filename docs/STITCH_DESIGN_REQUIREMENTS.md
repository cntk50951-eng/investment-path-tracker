# 🎨 Investment Path Platform 2026 - UI Redesign Requirements

## Project Info
- **Stitch Project ID**: `17702525323174062460`
- **Project Name**: Investment Path Platform 2026
- **Design Theme**: "Quantum Financial Interface"

---

## 📋 Page Inventory

### 1. Dashboard (主儀表板)
**Route**: `/dashboard` (default)

**Components:**
| Component | Position | Description | Priority |
|-----------|----------|-------------|----------|
| Header | Top | Logo, User Profile, Market/Function Tabs | High |
| MacroBar | Below Header | Horizontal scroll of economic indicators | High |
| FlowDiagram | Main Left | SVG flow chart with 5 nodes, path tabs, probability bar | Critical |
| NewsPanel | Main Right (sticky) | News feed with severity colors | High |
| SwitchTable | Below Flow | Data table showing transition progress | Medium |
| DetailPanel | Bottom | Contextual details for selected path/switch | Medium |
| ComplianceBanner | Below tabs | SFC regulatory disclaimer | High |
| PathLegend | Above Flow | Explains baseline path, probability meaning | Low |

**User States:**
- Free: Blurred paths (except baseline + highest prob), blurred news content
- Pro: Full access
- Debug: All paywalls bypassed

**Key Interactions:**
- Click node → Select path → Show detail panel
- Click switch row → Highlight in flow diagram → Show switch detail
- Click news → Open drawer with full content
- Market toggle (US/HK) → Refresh all data

---

### 2. News Timeline (新聞時間線)
**Route**: `/news`

**Components:**
| Component | Position | Description | Priority |
|-----------|----------|-------------|----------|
| Header | Top | Market/Function Tabs | High |
| TimelineFilter | Below Header | Filters: severity, path, tag, time range | Medium |
| Timeline | Center | Vertical timeline with news cards | Critical |
| NewsDrawer | Overlay | Full news details | Medium |

**Key Features:**
- Vertical timeline with central glowing line
- Alternating left/right cards (desktop)
- Single column (mobile)
- Filter by: severity (critical/medium/positive), path (A-E), tag, time (7d/30d/90d/all)

---

## 🎨 Design System Requirements

### Color Palette
```
PRIMARY: #6366f1 (Quantum Indigo)
SECONDARY: #a855f7 (Nebula Purple)
ACCENT: #22d3ee (Photon Cyan)

PATH_A: #4ade80 (Green - Bullish)
PATH_B: #fbbf24 (Amber - Neutral)
PATH_C: #f87171 (Red - Bearish)
PATH_D: #a78bfa (Purple - Volatile)
PATH_E: #f472b6 (Pink - High Risk)

CRITICAL: #f87171
WARNING: #fbbf24
POSITIVE: #4ade80
NEUTRAL: #94a3b8

BACKGROUND:
- Void: #030712 (base)
- Deep Space: #0f172a (sections)
- Event Horizon: #1e293b (cards)
- Quantum Field: #334155 (hover)
```

### Typography
```
HEADINGS: Space Grotesk (700/600)
BODY: Inter (400/500)
MONO: JetBrains Mono (for data)

SCALE:
- Display: 3.5rem/700 (hero metrics)
- Headline LG: 2.25rem/600 (page titles)
- Headline MD: 1.5rem/600 (section headers)
- Headline SM: 1.25rem/600 (card titles)
- Body LG: 1.125rem/400
- Body MD: 1rem/400
- Body SM: 0.875rem/400
- Mono LG: 1rem/500 (probabilities)
- Mono MD: 0.875rem/500 (tables)
```

### Shape & Elevation
```
CORNER RADIUS:
- Cards: 12px
- Buttons: 9999px (pill)
- Inputs: 8px
- Badges: 6px
- Flow Nodes: 11px

ELEVATION:
- No traditional shadows
- Tonal layering for depth
- Ambient glow (5% opacity) on interactive
- Glass morphism (80% + 12px blur) for overlays
```

### Motion
```
DURATION:
- Instant: 100ms (hover)
- Snappy: 200ms (clicks)
- Smooth: 300ms (expansions)
- Cinematic: 500ms (page transitions)

SIGNATURE:
- Flow paths draw sequentially (SVG pathLength)
- Nodes fade with stagger
- Probability bars expand from 0
- News items slide with 30ms stagger
- Glow pulse on current path (2s infinite)
```

---

## 🔧 Component Specifications

### FlowDiagram
**Function**: Visual representation of investment path transitions

**State Layers:**
1. SVG arrows (animated dashes)
2. Node rectangles (glow on current)
3. HTML lock overlays (for free users)
4. Probability bar (below)
5. Path tabs (above)

**Free User Behavior:**
- Locked nodes: dashed border, 30% opacity, 🔒 icon
- HTML overlay with blur + hover upgrade prompt
- Tab names shown as "•••" for locked paths
- Arrows hidden if both endpoints locked

**Pro User Behavior:**
- All nodes fully visible
- Glow effects on current + highest prob
- Click to see allocation details

**Animation:**
- Path length: 0→1 over 1.5s
- Flowing dashes on current path (infinite)
- Node pulse (current): 2s infinite
- Hover scale: 1.02

---

### NewsPanel
**Function**: Real-time news feed with severity coding

**Layout:**
- Sticky sidebar (desktop)
- Full width below flow (mobile)
- Max height: calc(100vh - 130px)
- Internal scroll

**News Item Structure:**
```
┌─ [Severity Color Border Left]
│  Date · Source
│  Title (bold)
│  Preview (blurred for free)
│  [Tags: Path→Path]
│  [🔒 Click to unlock] (free only)
```

**Interaction:**
- Click → NewsDrawer (right overlay)
- Hover: scale 1.02 + background tint

---

### SwitchTable
**Function**: Track progress of path transitions

**Columns:**
1. Direction (From→To with color-coded nodes)
2. Trigger (truncated, tooltip on hover)
3. Progress Bar (color = to-node color)
4. Progress Text (% + confirm counts)
5. Estimated Time
6. Status Badge (⚠️/🟡/🔵/⚪)

**Status Thresholds:**
- ≥60%: ⚠️ 高度警戒 (critical)
- ≥35%: 🟡 需監控 (warning)
- ≥15%: 🔵 低壓力 (low)
- <15%: ⚪ 未觸發 (inactive)

**Row Click**: Select switch → Highlight in flow → Show detail

---

### DetailPanel
**Function**: Contextual details for selected item

**Empty State**: "點擊切換或路徑查看詳情"

**Switch Detail:**
- Progress summary (large % + counts)
- Progress bar with markers (35/50/75%)
- Tier badge (layer + action)
- Trigger box (border color = node color)
- Confirm list (✅/🔶/❌ per item) - Pro only
- Next checkpoint

**Path Detail:**
- Path name + probability
- Current baseline indicator (⭐)
- Allocation tier list - Pro only

**BlurLock Pattern:**
- Hard blur for Pro content
- Gradient overlay
- Static 🔒 icon
- Hover: 💎 Pro badge + upgrade hint

---

### TimelineFilter
**Function**: Filter news by multiple dimensions

**Filters:**
1. Severity: dropdown (All/Critical/Medium/Positive)
2. Path: dropdown (All/A/B/C/D/E)
3. Tag: multi-select chips
4. Time: segmented (7d/30d/90d/All)

**Layout:**
- Sticky below header
- Compact horizontal layout
- Clear all button

---

## 📱 Responsive Breakpoints

### Desktop (≥1280px)
- Full dashboard: 2-column (65% + 35%)
- News panel: sticky sidebar
- Hover states enabled
- Maximum data density

### Tablet (768-1279px)
- News panel: below flow diagram
- Switch table: horizontal scroll
- Reduced padding (24px → 16px)

### Mobile (<768px)
- Single column layout
- Stack order: Macros → Flow → News → Switches → Details
- Touch targets: 44px minimum
- Bottom sheet modals
- Simplified flow (vertical if needed)

---

## 🎯 Screen Generation Plan

### Screen 1: Dashboard (Desktop)
**Prompt Keywords:**
- Investment dashboard, dark theme, deep space
- Flow diagram center: 5 colored nodes connected
- News sidebar right, sticky
- Data table below flow
- Glowing accents, indigo/purple/cyan
- Space Grotesk headings, Inter body
- Monospace numbers
- Glass morphism overlays
- Desktop 1280x800

### Screen 2: Dashboard (Mobile)
**Prompt Keywords:**
- Same dashboard, mobile vertical stack
- Single column
- Touch-friendly buttons
- Bottom navigation
- Mobile 390x844

### Screen 3: News Timeline (Desktop)
**Prompt Keywords:**
- Vertical timeline, centered
- Alternating news cards left/right
- Central glowing line
- Filter bar at top
- Dark theme, sci-fi
- Desktop 1280x800

### Screen 4: News Timeline (Mobile)
**Prompt Keywords:**
- Mobile timeline, single column
- Cards stacked vertically
- Filter chips horizontal scroll
- Mobile 390x844

### Screen 5: Component Library
**Prompt Keywords:**
- UI kit page showing:
- Flow nodes (5 states: normal/current/locked/hover/selected)
- News cards (3 severities)
- Status badges (4 types)
- Progress bars
- Buttons (primary/secondary/ghost)
- Input fields
- Toggle tabs

---

## 🚀 Next Steps

1. ✅ Create Stitch project (`17702525323174062460`)
2. ✅ Create design system (pending API timeout fix)
3. ⏳ Generate Screen 1: Dashboard Desktop
4. ⏳ Generate Screen 2: Dashboard Mobile
5. ⏳ Generate Screen 3: News Timeline Desktop
6. ⏳ Generate Screen 4: News Timeline Mobile
7. ⏳ Generate Screen 5: Component Library
8. ⏳ Review and iterate on designs
9. ⏳ Export design tokens for implementation

---

## 📝 Notes

- **API Key Issue**: Stitch API key exposed in `opencode.json` — consider env var
- **Timeout Issue**: Gemini 3.1 Pro timing out — try Gemini 3 Flash or retry
- **Design MD**: Create `.stitch/DESIGN.md` for persistent design system rules
- **Reference Projects**: 
  - LongView Investment Platform (`4825278155478083348`) - existing design system
  - AI Trading Pro Dashboard (`6081637929052455365`) - dark mode reference
