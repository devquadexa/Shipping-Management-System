# Petty Cash Search & Filter - UI Guide

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Petty Cash Assignments (5 of 20)                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  ┌─────────────────┐ │
│  │ 🔍 Search by Job ID, Customer Name...  ✕ │  │ 🔽 All Statuses │ │
│  └──────────────────────────────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Assignment ID │ Job ID │ Customer │ Assigned To │ Status │ ...    │
├─────────────────────────────────────────────────────────────────────┤
│  #1001         │ JOB001 │ ABC Co   │ John Doe    │ Settled│ ...    │
│  #1002         │ JOB002 │ XYZ Ltd  │ Jane Smith  │ Settled│ ...    │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Search Box (Left Side)
```
┌──────────────────────────────────────────┐
│ 🔍 Search by Job ID, Customer Name...  ✕ │
└──────────────────────────────────────────┘
```
- **Icon**: Magnifying glass on the left
- **Input**: Full-width text input
- **Clear Button**: X button appears when text is entered
- **Placeholder**: Guides users on searchable fields

### 2. Status Filter (Right Side)
```
┌─────────────────┐
│ 🔽 All Statuses │
└─────────────────┘
```
- **Icon**: Filter funnel on the left
- **Dropdown**: Shows all available statuses
- **Default**: "All Statuses" selected

### 3. Empty State (When No Results)
```
┌─────────────────────────────────────────┐
│              🔍                          │
│                                          │
│  No assignments match your search       │
│  criteria                                │
│                                          │
│  ┌─────────────────┐                    │
│  │ Clear Filters   │                    │
│  └─────────────────┘                    │
└─────────────────────────────────────────┘
```

## Search Examples

### Example 1: Search by Job ID
```
Input: "JOB001"
Result: Shows all assignments for JOB001
```

### Example 2: Search by Customer Name
```
Input: "ABC"
Result: Shows all assignments for customers with "ABC" in their name
```

### Example 3: Search by CUSDEC Number
```
Input: "CUSDEC123"
Result: Shows assignments with CUSDEC number containing "CUSDEC123"
```

### Example 4: Search by Waff Clerk
```
Input: "John"
Result: Shows all assignments assigned to clerks with "John" in their name
```

### Example 5: Combined Search and Filter
```
Search: "ABC"
Filter: "Settled"
Result: Shows only settled assignments for customers with "ABC" in name
```

## Status Filter Options

1. **All Statuses** - Shows all assignments (default)
2. **Assigned** - Shows only newly assigned, not yet settled
3. **Settled** - Shows settled assignments
4. **Balance To Be Return** - Shows assignments with balance to return
5. **Over Due** - Shows overdue assignments
6. **Pending Approval** - Shows assignments pending approval
7. **Pending Approval / Balance** - Balance return pending approval
8. **Pending Approval / Over Due** - Overdue collection pending approval
9. **Balance Returned** - Balance has been returned
10. **Overdue Collected** - Overdue amount has been collected
11. **Settled / Balance Returned** - Settled with balance returned
12. **Settled / Over Due Collected** - Settled with overdue collected
13. **Settled/Approved** - Settled and approved
14. **Settled/Rejected** - Settled but rejected
15. **Closed** - Assignment is closed

## Responsive Behavior

### Desktop (> 768px)
```
┌────────────────────────────────────────────────────────┐
│  [Search Box - 60% width]  [Filter - 20% width]       │
└────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────────────┐
│  [Search Box - 100%]     │
├──────────────────────────┤
│  [Filter - 100%]         │
└──────────────────────────┘
```

## Color Scheme

### Search Box
- Background: White (#ffffff)
- Border: Light gray (#d1d5db)
- Focus Border: Blue (#3b82f6)
- Icon Color: Gray (#9ca3af)

### Filter Dropdown
- Background: White (#ffffff)
- Border: Light gray (#d1d5db)
- Focus Border: Blue (#3b82f6)
- Icon Color: Gray (#9ca3af)

### Clear Button
- Default: Gray (#9ca3af)
- Hover: Dark gray (#374151)
- Hover Background: Light gray (#f3f4f6)

## Keyboard Shortcuts

- **Tab**: Navigate between search and filter
- **Enter**: Submit search (auto-filters as you type)
- **Escape**: Clear search when focused on search box
- **Arrow Keys**: Navigate dropdown options in filter

## Accessibility Features

1. **ARIA Labels**: All interactive elements have proper labels
2. **Keyboard Navigation**: Full keyboard support
3. **Focus Indicators**: Clear visual focus states
4. **Screen Reader Support**: Descriptive text for all actions
5. **Color Contrast**: WCAG AA compliant color contrast ratios

## Performance Notes

- **Real-time Filtering**: Filters update as you type (debounced)
- **Client-side Only**: No server requests for filtering
- **Efficient Rendering**: Only filtered results are rendered
- **Grouped Filtering**: Maintains assignment grouping logic

## Tips for Users

1. **Partial Matches**: Search works with partial text (e.g., "JOB" finds "JOB001", "JOB002")
2. **Case Insensitive**: Search is not case-sensitive
3. **Multiple Filters**: Combine search and status filter for precise results
4. **Clear Quickly**: Use the X button or "Clear Filters" to reset
5. **Count Display**: Header shows how many results match your filters
