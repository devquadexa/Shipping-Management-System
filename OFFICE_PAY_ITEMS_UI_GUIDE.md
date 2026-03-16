# Office Pay Items UI - Visual Guide

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Office Pay Items                                                 │
│ Record upfront payments made by office staff                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Payment Records                              [+ Add Payment]    │
├─────────────────────────────────────────────────────────────────┤
│ Description │ Actual Cost │ Billing Amount │ Paid By │ Date │ ⚙ │
├─────────────────────────────────────────────────────────────────┤
│ DO Charges  │ LKR 5,000   │ LKR 5,500      │ John    │ ...  │✏️🗑│
│ Port Fees   │ LKR 2,500   │ LKR 2,500      │ Jane    │ ...  │✏️🗑│
├─────────────────────────────────────────────────────────────────┤
│ Total Actual Cost:      LKR 7,500                               │
│ Total Billing Amount:   LKR 8,000                               │
│ Profit Margin:          LKR 500 (✓ Positive)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Button Positioning

### Desktop View
```
┌──────────────────────────────────────────────────────────────┐
│ Payment Records                    [+ Add Payment] ← Top Right │
└──────────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────────────────────────────────────────────────┐
│ Payment Records                                              │
│ [+ Add Payment] ← Full Width                                 │
└──────────────────────────────────────────────────────────────┘
```

## Icon Actions

### Edit Icon (Pencil)
```
┌─────────────────────────────────────────────────────────────┐
│ Description │ Amount │ Billing │ Paid By │ Date │ [✏️] [🗑] │
│             │        │         │         │      │           │
│ DO Charges  │ 5,000  │ 5,500   │ John    │ ...  │ ✏️  🗑    │
│             │        │         │         │      │           │
│ Hover:      │        │         │         │      │ [✏️] [🗑] │
│             │        │         │         │      │ Blue  Red  │
└─────────────────────────────────────────────────────────────┘
```

### Delete Icon (Trash)
- Clicking shows confirmation dialog
- On confirm: Item is deleted
- Success message displays
- Table refreshes automatically

## Column Alignment

### Desktop (1400px+)
```
Description (25%) │ Actual Cost (15%) │ Billing (15%) │ Paid By (15%) │ Date (15%) │ Actions (10%)
Left Aligned      │ Right Aligned     │ Right Aligned │ Left Aligned  │ Left       │ Center
```

### Tablet (768px - 1024px)
```
Description (30%) │ Actual Cost (18%) │ Billing (18%) │ Paid By (18%) │ Date (16%)
```

### Mobile (< 768px)
```
Card Layout:
┌─────────────────────────────────┐
│ Description: DO Charges         │
│ Actual Cost: LKR 5,000          │
│ Billing Amount: LKR 5,500       │
│ Paid By: John                   │
│ Payment Date: Mar 14, 2026      │
│ [✏️] [🗑]                        │
└─────────────────────────────────┘
```

## Color Scheme

### Primary Actions
```
Button: Linear Gradient
From: #2563eb (Blue)
To:   #1d4ed8 (Dark Blue)
Hover: Darker gradient with shadow
```

### Text Colors
```
Headers:     #1a1a2e (Navy)
Body Text:   #333 (Dark Gray)
Secondary:   #666 (Medium Gray)
```

### Status Colors
```
Profit Positive: #16a34a (Green)
Profit Negative: #dc2626 (Red)
Success Alert:   #22c55e (Light Green)
Error Alert:     #ef4444 (Light Red)
```

### Background Colors
```
Table Header:    #f8f9fa (Light Gray)
Table Rows:      #ffffff (White)
Hover Row:       #f9fafb (Very Light Gray)
Totals Section:  #f8f9fa (Light Gray)
```

## Form Layout

### Add/Edit Form
```
┌─────────────────────────────────────────────────────────────┐
│ Add New Office Payment                                    [×] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Description *              │ Amount Paid (LKR) *            │
│ [________________]         │ [________________]             │
│                                                              │
│ Billing Amount (LKR)       │ Notes                          │
│ [________________]         │ [________________]             │
│ Can be set later           │ [________________]             │
│                                                              │
│                                    [Add Payment] [Cancel]   │
└─────────────────────────────────────────────────────────────┘
```

## Empty State

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                          📦                                 │
│                                                              │
│                  No Office Payments Yet                      │
│                                                              │
│        Add upfront payments made by office staff            │
│        for this job                                         │
│                                                              │
│                    [+ Add Payment]                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

### Desktop (1400px+)
- Full table layout
- All columns visible
- Add Payment button in header bar
- Hover effects active

### Laptop (1024px - 1399px)
- Adjusted column widths
- All columns still visible
- Full functionality

### Tablet (768px - 1023px)
- Card-based layout
- Data labels visible
- Stacked action buttons
- Full-width Add Payment button

### Mobile (480px - 767px)
- Optimized card layout
- Smaller fonts
- Compact spacing
- Touch-friendly buttons

### Small Mobile (< 480px)
- Minimal padding
- Reduced font sizes
- Simplified layout
- Maximum readability

## Hover Effects

### Add Payment Button
```
Normal:  Blue gradient with subtle shadow
Hover:   Darker blue gradient with larger shadow
         Slight upward translation (2px)
```

### Edit Icon Button
```
Normal:  Transparent background, gray icon
Hover:   Light blue background (#dbeafe)
         Blue icon (#2563eb)
```

### Delete Icon Button
```
Normal:  Transparent background, gray icon
Hover:   Light red background (#fee2e2)
         Red icon (#dc2626)
```

### Table Row
```
Normal:  White background
Hover:   Light gray background (#f9fafb)
         Smooth transition (0.2s)
```

## Typography Hierarchy

### Level 1 (Section Title)
```
Font Size: 1.75rem
Font Weight: 600
Color: #1a1a2e
Letter Spacing: -0.5px
```

### Level 2 (Form Title)
```
Font Size: 1.25rem
Font Weight: 600
Color: #1a1a2e
```

### Level 3 (Table Header)
```
Font Size: 0.85rem
Font Weight: 600
Color: #1a1a2e
Text Transform: UPPERCASE
Letter Spacing: 0.5px
```

### Level 4 (Table Cell)
```
Font Size: 0.9rem
Font Weight: 400
Color: #333
```

### Level 5 (Label)
```
Font Size: 0.9rem
Font Weight: 500
Color: #1a1a2e
```

### Level 6 (Help Text)
```
Font Size: 0.8rem
Font Weight: 400
Color: #666
Font Style: italic
```

## Spacing System

### Vertical Spacing
```
Section Padding:        2rem
Form Padding:           1.5rem
Table Cell Padding:     1.25rem
Form Field Padding:     0.75rem
Button Padding:         0.75rem 1.5rem
```

### Horizontal Spacing
```
Form Row Gap:           1.5rem
Action Icons Gap:       0.75rem
Button Gap:             0.75rem
```

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close forms
- Arrow keys for table navigation (future)

### Screen Readers
- ARIA labels on icon buttons
- Semantic HTML structure
- Proper heading hierarchy
- Form labels associated with inputs

### Color Contrast
- Text on background: 4.5:1 ratio (WCAG AA)
- Button text: 4.5:1 ratio (WCAG AA)
- Icon colors: Sufficient contrast

### Focus States
- Visible focus ring on all interactive elements
- Blue border with shadow on form inputs
- Clear visual indication of focused element

## Animation & Transitions

### Button Hover
```
Duration: 0.3s
Easing: ease
Properties: background, transform, box-shadow
```

### Row Hover
```
Duration: 0.2s
Easing: ease
Properties: background-color
```

### Form Input Focus
```
Duration: 0.2s
Easing: ease
Properties: border-color, box-shadow
```

### Loading Spinner
```
Duration: 1s
Easing: linear
Animation: rotate 360deg
```

## Professional Touches

1. **Gradient Backgrounds**: Modern, professional appearance
2. **Subtle Shadows**: Depth without being overwhelming
3. **Monospace Currency**: Proper alignment and readability
4. **Icon-Based Actions**: Clean, modern interface
5. **Consistent Spacing**: Professional layout
6. **Color Coding**: Intuitive status indication
7. **Smooth Transitions**: Polished user experience
8. **Responsive Design**: Works on all devices
9. **Accessibility**: Inclusive for all users
10. **International Standard**: Suitable for global cargo company

## Best Practices Implemented

✅ Mobile-first responsive design
✅ Semantic HTML structure
✅ CSS Grid for layout
✅ Flexbox for alignment
✅ CSS variables for consistency
✅ Proper color contrast
✅ Keyboard navigation support
✅ ARIA labels and roles
✅ Smooth animations
✅ Professional typography
✅ Consistent spacing
✅ Clear visual hierarchy
✅ Intuitive interactions
✅ Error prevention
✅ User feedback
