# Visual Guide - New Assignment ID Format

## Overview

The Petty Cash Management now shows:
- **One main assignment ID** (e.g., #88)
- **Sub-assignments** numbered as #88-1, #88-2, etc.
- **Integrated view** (no separate "Grouped" section)

---

## Example 1: Two Assignments for Same Job+User

### Before (Old System)
```
┌────┬─────┬─────────┬──────────┬────────┬────────┐
│ ▶  │ #89 │ JOB0002 │ Clerk 01 │ Settled│ 10,000 │
│ ▶  │ #87 │ JOB0002 │ Clerk 01 │ Settled│ 10,000 │
└────┴─────┴─────────┴──────────┴────────┴────────┘
Problem: Two separate rows, hard to see total
```

### After (New System)
```
Main View (Collapsed):
┌────┬─────┬─────────┬──────────┬────────┬────────┐
│ ▶  │ #88 │ JOB0002 │ Clerk 01 │ Settled│ 20,000 │ ← Total
└────┴─────┴─────────┴──────────┴────────┴────────┘

Expanded View:
┌────┬─────┬─────────┬──────────┬────────┬────────┐
│ ▼  │ #88 │ JOB0002 │ Clerk 01 │ Settled│ 20,000 │
├────┼─────┼─────────┼──────────┼────────┼────────┤
│  ▶ │ #88 │ JOB0002 │ Clerk 01 │ Settled│ 10,000 │ ← Main
│  ▶ │#88-1│ JOB0002 │ Clerk 01 │ Settled│ 10,000 │ ← Sub 1
└────┴─────┴─────────┴──────────┴────────┴────────┘
```

---

## Example 2: Three Assignments for Same Job+User

### Main View (Collapsed)
```
┌────┬─────┬─────────┬──────────┬─────────┬────────┐
│ ▶  │ #88 │ JOB0002 │ Clerk 01 │ Assigned│ 25,000 │
└────┴─────┴─────────┴──────────┴─────────┴────────┘
                                            ↑
                                    Total: 10,000 + 10,000 + 5,000
```

### Expanded View
```
┌────┬─────┬─────────┬──────────┬─────────┬────────┐
│ ▼  │ #88 │ JOB0002 │ Clerk 01 │ Assigned│ 25,000 │
├────┼─────┼─────────┼──────────┼─────────┼────────┤
│  ▶ │ #88 │ JOB0002 │ Clerk 01 │ Settled │ 10,000 │ ← Main (ID: 88)
│  ▶ │#88-1│ JOB0002 │ Clerk 01 │ Settled │ 10,000 │ ← Sub 1 (ID: 87)
│  ▶ │#88-2│ JOB0002 │ Clerk 01 │ Assigned│  5,000 │ ← Sub 2 (ID: 95)
└────┴─────┴─────────┴──────────┴─────────┴────────┘
```

---

## Example 3: Single Assignment (No Sub-Assignments)

### Main View
```
┌────┬─────┬─────────┬──────────┬────────┬────────┐
│ ▶  │ #89 │ JOB0003 │ Clerk 02 │ Settled│ 15,000 │
└────┴─────┴─────────┴──────────┴────────┴────────┘
```

### Expanded View
```
┌────┬─────┬─────────┬──────────┬────────┬────────┐
│ ▼  │ #89 │ JOB0003 │ Clerk 02 │ Settled│ 15,000 │
├────┴─────┴─────────┴──────────┴────────┴────────┤
│ Settlement Details:                              │
│ - Item 1: Transport - LKR 5,000                  │
│ - Item 2: Loading - LKR 4,000                    │
│ - Item 3: Misc - LKR 6,000                       │
│ Total Spent: LKR 15,000                          │
└──────────────────────────────────────────────────┘
```

---

## Assignment ID Logic

### Rule 1: Main Assignment ID
The first assignment in a group determines the main ID.

```
Example:
- First assignment created: ID = 88
- Main row shows: #88
- Total amount: Sum of all assignments
```

### Rule 2: Sub-Assignment Numbering
Sub-assignments are numbered sequentially starting from 1.

```
Index 0 (First):  #88     (Main assignment)
Index 1 (Second): #88-1   (First sub-assignment)
Index 2 (Third):  #88-2   (Second sub-assignment)
Index 3 (Fourth): #88-3   (Third sub-assignment)
```

### Rule 3: Single Assignments
If there's only one assignment, no sub-numbering is needed.

```
Single assignment: #89
No sub-assignments to show
```

---

## Real-World Scenario

### Scenario: Manager assigns petty cash multiple times

**Day 1:**
```
Manager assigns LKR 10,000 to Clerk 01 for JOB0002
→ Assignment ID: 88
→ Shows as: #88
```

**Day 2:**
```
Manager assigns additional LKR 10,000 to Clerk 01 for JOB0002
→ Assignment ID: 87
→ Main row still shows: #88 (total: 20,000)
→ When expanded:
  - #88 (first assignment)
  - #88-1 (second assignment, actual ID: 87)
```

**Day 3:**
```
Manager assigns another LKR 5,000 to Clerk 01 for JOB0002
→ Assignment ID: 95
→ Main row still shows: #88 (total: 25,000)
→ When expanded:
  - #88 (first assignment)
  - #88-1 (second assignment, actual ID: 87)
  - #88-2 (third assignment, actual ID: 95)
```

---

## User Interface Flow

### Step 1: View Main Table
```
User sees:
┌────┬─────┬─────────┬──────────┬────────┬────────┐
│ ▶  │ #88 │ JOB0002 │ Clerk 01 │ Status │ 25,000 │
└────┴─────┴─────────┴──────────┴────────┴────────┘

Thinks: "This job has LKR 25,000 assigned"
```

### Step 2: Click Expand (▶)
```
User clicks expand button
↓
Row expands to show:
┌────┬─────┬─────────┬──────────┬────────┬────────┐
│ ▼  │ #88 │ JOB0002 │ Clerk 01 │ Status │ 25,000 │
├────┼─────┼─────────┼──────────┼────────┼────────┤
│  ▶ │ #88 │ JOB0002 │ Clerk 01 │ Settled│ 10,000 │
│  ▶ │#88-1│ JOB0002 │ Clerk 01 │ Settled│ 10,000 │
│  ▶ │#88-2│ JOB0002 │ Clerk 01 │ Assigned│ 5,000 │
└────┴─────┴─────────┴──────────┴────────┴────────┘

Thinks: "Ah, there are 3 separate assignments:
- Main assignment #88: 10,000 (settled)
- Sub-assignment #88-1: 10,000 (settled)
- Sub-assignment #88-2: 5,000 (needs settlement)"
```

### Step 3: Settle Individual Assignment
```
User clicks "Settle" on #88-2
↓
Settlement modal opens
↓
User enters settlement details
↓
Assignment #88-2 is marked as settled
```

---

## Benefits of New Format

### 1. Clear Hierarchy
```
#88       ← Main assignment (parent)
  #88-1   ← Sub-assignment (child)
  #88-2   ← Sub-assignment (child)
```

### 2. Easy to Understand
- Main ID shows the "group"
- Sub-numbers show individual assignments
- Total is visible at a glance

### 3. Professional Appearance
- Consistent numbering scheme
- Clear parent-child relationship
- Industry-standard format

### 4. Scalable
```
Can handle many sub-assignments:
#88
#88-1
#88-2
#88-3
#88-4
... and so on
```

---

## Comparison Table

| Feature | Old System | New System |
|---------|-----------|------------|
| Multiple assignments | Separate rows | One row (grouped) |
| Assignment IDs | #89, #87 | #88, #88-1 |
| Total amount | Manual calculation | Shown automatically |
| Visual clarity | Cluttered | Clean |
| Sub-assignment indication | None | Clear numbering |

---

## Technical Details

### Frontend Logic
```javascript
// Main row always shows first assignment ID
<strong className="assignment-id">#{first.assignmentId}</strong>

// Sub-assignments use index-based numbering
const subAssignmentId = index === 0 
  ? `#${assignment.assignmentId}`      // First: #88
  : `#${first.assignmentId}-${index}`; // Others: #88-1, #88-2
```

### Database
```
Actual database IDs remain unchanged:
- Assignment 1: ID = 88
- Assignment 2: ID = 87
- Assignment 3: ID = 95

Display IDs are calculated on the fly:
- Assignment 1: Shows as #88
- Assignment 2: Shows as #88-1
- Assignment 3: Shows as #88-2
```

---

## Summary

✅ **One main ID** per job+user combination
✅ **Sub-assignments** numbered sequentially (#88-1, #88-2)
✅ **Clear hierarchy** showing parent-child relationship
✅ **Total amount** visible without expanding
✅ **Professional format** that's easy to understand

---

**Status**: ✅ Implemented and Ready
**Format**: #[MainID]-[SubIndex]
**Example**: #88, #88-1, #88-2
