# Laporan Card Warning & Link to Edit

## Problem
On the puskesmas laporan page, cards with `target_k === 0` or angkas not yet inputted (null/undefined) give no actionable guidance. Users don't know they need to fix these values or where to do it.

## Solution
Add inline warning with clickable link on each affected LaporanInputCard, linking directly to the relevant row on the target/angkas page with blink highlight.

## Warning Display

### Condition 1: Target kinerja is 0
- **Condition:** `row.target_k === 0 || !row.target_k`
- **Display:** `⚠️ Target belum diisi — Ubah di sini`
- **Link:** `/target?tab=target-kinerja&highlight=sub:{id_sub_kegiatan}`
- "Ubah di sini" is a blue underlined link

### Condition 2: Angkas not yet inputted
- **Condition:** `row.isManualAngkas && (row.angkas === null || row.angkas === undefined)`
- **Important:** `angkas === 0` is a valid value (explicitly set to 0), NOT a warning condition
- **Display:** `⚠️ Angkas belum diinput — Ubah di sini`
- **Link:** `/target?tab=angkas&highlight=sub:{id_sub_kegiatan}-sa:{id_sumber_anggaran}`
- "Ubah di sini" is a blue underlined link

### Warning styling
- Warning icon (⚠️) in amber/warning color
- Text in muted/secondary color
- "Ubah di sini" as a `<Link>` with blue color, underline, standard link styling
- Placed directly below the relevant label (Kinerja / Angkas) in the target section of the card

## Highlight on Target Page

### URL param format
- `highlight=sub:{id_sub_kegiatan}` for target kinerja
- `highlight=sub:{id_sub_kegiatan}-sa:{id_sumber_anggaran}` for angkas

### Behavior on target page
1. Read `highlight` query param via `useSearchParams()`
2. Match row in Ant Design Table using `rowClassName` → add `highlight-row` class
3. `useEffect` → `scrollIntoView({ behavior: 'smooth', block: 'center' })` to the matched row
4. CSS `@keyframes highlight-blink` — background pulses amber 3-4 times over ~3 seconds, then stops
5. After animation ends, remove highlight class (cleanup)

### CSS animation
```css
@keyframes highlight-blink {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(232, 150, 30, 0.2); }
}
.highlight-row td {
  animation: highlight-blink 0.75s ease-in-out 4;
}
```

## Files affected
1. `frontend/src/components/LaporanInputCard.tsx` — add warning + link for both conditions
2. `frontend/src/pages/PuskesmasTargetKinerjaPage.tsx` — read highlight param, rowClassName, scrollIntoView
3. `frontend/src/pages/PuskesmasAngkasPage.tsx` — read highlight param, rowClassName, scrollIntoView
4. `frontend/src/components/LaporanBulkInput.css` — blink animation CSS

## Edge cases
- Both warnings can appear on the same card (target_k=0 AND angkas not inputted)
- If editing permission is disabled on target page, user still sees the row highlighted but edit button is disabled — existing permission UI handles this
- Tab auto-selection: `?tab=` param already works on PuskesmasTargetPage
