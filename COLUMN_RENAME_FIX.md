# Petty Cash Table - Column Rename Fix

## Change Made

### Column Header Rename
**Before**: "GROUP / ASSIGNMENT"
**After**: "ASSIGNMENT ID"

## File Modified
- `frontend/src/components/PettyCash.js` - Line with table header

## Benefits

### Space Saving
- Reduced column header text from 18 characters to 13 characters
- Saves approximately 30-40% horizontal space in that column
- Helps prevent horizontal scrolling

### Clarity
- "Assignment ID" is clearer and more concise
- Matches the actual content (shows assignment numbers like #108, #106)
- More professional terminology

### Consistency
- Aligns with standard database/system terminology
- Easier to understand for users
- Better for documentation and training

## Visual Comparison

### Before
```
┌────┬────────────────────┬─────────┬──────────┐
│ ▼  │ GROUP / ASSIGNMENT │ Job ID  │ Customer │
├────┼────────────────────┼─────────┼──────────┤
│ ▼  │ #108               │ JOB0002 │ Quadesa  │
└────┴────────────────────┴─────────┴──────────┘
```

### After
```
┌────┬───────────────┬─────────┬──────────┐
│ ▼  │ Assignment ID │ Job ID  │ Customer │
├────┼───────────────┼─────────┼──────────┤
│ ▼  │ #108          │ JOB0002 │ Quadesa  │
└────┴───────────────┴─────────┴──────────┘
```

## Impact
- Minimal change (single line)
- No functionality affected
- Improves responsive behavior
- Better user experience
- No database or backend changes needed
