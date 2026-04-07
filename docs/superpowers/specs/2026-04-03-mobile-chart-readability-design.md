# Mobile Line Chart Readability

## Problem
Line chart (Budget Realisasi) on mobile devices has:
1. **X-axis labels overlap** — month names stack on each other, unreadable
2. **Dots too large** — r:4 dots clutter the chart on small screens

## Solution: Rotate Labels + Abbreviate Months + Smaller Dots

### Changes to `chartConfig.ts`

Add new config fields:

| Field | Mobile | Desktop |
|-------|--------|---------|
| `xAxisAngle` | -45 | 0 |
| `xAxisHeight` | 60 | 30 |
| `xAxisTextAnchor` | "end" | "middle" |
| `dotRadius` | 2 | 4 |
| `activeDotRadius` | 4 | 6 |

Keep `xAxisInterval` unchanged (1 mobile, 0 desktop).

### Changes to `DashboardPage.tsx` and `PuskesmasDashboardPage.tsx`

**XAxis component:**
- Use `angle={chartCfg.xAxisAngle}`
- Use `height={chartCfg.xAxisHeight}`
- Use `textAnchor={chartCfg.xAxisTextAnchor}`
- Add `tickFormatter` on mobile to abbreviate months: "Januari" → "Jan", "Februari" → "Feb", etc.

**Line components:**
- `dot={{ fill: color, r: chartCfg.dotRadius }}`
- `activeDot={{ r: chartCfg.activeDotRadius }}`

### Month abbreviation mapping
Only applied on mobile via tickFormatter:
- Januari → Jan, Februari → Feb, Maret → Mar, April → Apr
- Mei → Mei, Juni → Jun, Juli → Jul, Agustus → Agu
- September → Sep, Oktober → Okt, November → Nov, Desember → Des

### Files affected
1. `frontend/src/utils/chartConfig.ts` — add new config fields
2. `frontend/src/utils/chartConfig.test.ts` — update tests for new fields
3. `frontend/src/pages/DashboardPage.tsx` — apply config to XAxis and Line dots
4. `frontend/src/pages/PuskesmasDashboardPage.tsx` — same changes

### Testing approach (TDD)
1. Unit test `chartConfig` for new fields (mobile vs desktop values)
2. Unit test month abbreviation formatter function
3. Visual verification on mobile viewport
