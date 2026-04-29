# Visual Guide - Job ID with CUSDEC Display

## 📊 Display Layout

### Jobs WITH CUSDEC Number

```
Job Management Table
┌──────────────────────────────────────────────────────────────┐
│ Job ID / CUSDEC Number │ Customer │ Category │ Status │ ... │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐   │          │          │        │     │
│ │ JOB0001          │   │ ABC Corp │ FCL      │ Open   │ ... │
│ │ I - 12345        │   │          │          │        │     │
│ └──────────────────┘   │          │          │        │     │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐   │          │          │        │     │
│ │ JOB0042          │   │ XYZ Ltd  │ LCL      │ In Prog│ ... │
│ │ I - 67890        │   │          │          │        │     │
│ └──────────────────┘   │          │          │        │     │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐   │          │          │        │     │
│ │ JOB0015          │   │ DEF Inc  │ Air      │ Pending│ ... │
│ │ I - 54321        │   │          │          │        │     │
│ └──────────────────┘   │          │          │        │     │
└──────────────────────────────────────────────────────────────┘
```

### Jobs WITHOUT CUSDEC Number

```
┌──────────────────────────────────────────────────────────────┐
│ Job ID / CUSDEC Number │ Customer │ Category │ Status │ ... │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐   │          │          │        │     │
│ │ JOB0099          │   │ GHI Corp │ BOI      │ Compl. │ ... │
│ └──────────────────┘   │          │          │        │     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Styling Details

### Job ID (job-id-main)
```
┌──────────────────┐
│ JOB0001          │
└──────────────────┘
  ↑
  - Dark text (#101036)
  - Bold font (600 weight)
  - Light gray background (#f3f4f6)
  - Padding: 4px 8px
  - Border radius: 4px
  - Monospace font
  - Size: 0.9rem
```

### CUSDEC Number (cusdec-number)
```
I - 12345
↑
- Gray text (#6b7280)
- Medium font weight (500)
- No background
- Padding: 2px 4px
- Monospace font
- Size: 0.85rem
```

---

## 📱 Responsive Behavior

### Desktop (Full Width)
```
┌─────────────────────────────┐
│ JOB0001                     │
│ I - 12345                   │
└─────────────────────────────┘
```

### Tablet (Medium Width)
```
┌──────────────────┐
│ JOB0001          │
│ I - 12345        │
└──────────────────┘
```

### Mobile (Small Width)
```
┌──────────────┐
│ JOB0001      │
│ I - 12345    │
└──────────────┘
```

---

## ✨ Key Features

✅ **Two-Line Display**
- Job ID on first line with background
- CUSDEC on second line in gray

✅ **Clear Visual Hierarchy**
- Job ID is more prominent (darker, bolder)
- CUSDEC is secondary (lighter, smaller)

✅ **Professional Styling**
- Consistent with design system
- Proper spacing and alignment
- Monospace font for technical data

✅ **Robust Handling**
- Shows both when available
- Shows only Job ID when CUSDEC is missing
- Handles whitespace correctly

---

## 🔄 Comparison

### Before
```
JOB0001 / I - 12345
(single line, might overflow)
```

### After
```
JOB0001
I - 12345
(two lines, clear separation)
```

---

## 📋 Implementation Details

| Property | Value |
|----------|-------|
| **Layout** | Vertical (flex-direction: column) |
| **Gap** | 4px between lines |
| **Font** | Courier New (monospace) |
| **Job ID Size** | 0.9rem |
| **CUSDEC Size** | 0.85rem |
| **Job ID Color** | #101036 (dark) |
| **CUSDEC Color** | #6b7280 (gray) |
| **Job ID Background** | #f3f4f6 (light gray) |
| **CUSDEC Background** | None |

---

**Status**: ✅ Ready for Deployment
