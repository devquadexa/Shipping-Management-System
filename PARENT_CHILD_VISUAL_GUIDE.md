# Parent-Child Petty Cash Assignments - Visual Guide

## Current Problem vs Solution

### BEFORE (Current System)
```
Petty Cash Assignments Table
┌─────────────┬──────────────┬──────────────┬──────────┐
│ Assignment  │ Job ID       │ User         │ Amount   │
├─────────────┼──────────────┼──────────────┼──────────┤
│ #89         │ JOB0002      │ Clerk 01     │ 10,000   │
│ #87         │ JOB0002      │ Clerk 01     │ 10,000   │
│ #92         │ JOB0003      │ Clerk 02     │ 15,000   │
└─────────────┴──────────────┴──────────────┴──────────┘

Problem: Multiple rows for same job+user
```

### AFTER (New System)
```
Petty Cash Assignments Table (Aggregated View)
┌────┬──────────────┬──────────────┬──────────────┬─────────────┐
│ ▶  │ Job ID       │ User         │ Total Amount │ Assignments │
├────┼──────────────┼──────────────┼──────────────┼─────────────┤
│ ▶  │ JOB0002      │ Clerk 01     │ 20,000       │ 2 assigns   │
│ ▶  │ JOB0003      │ Clerk 02     │ 15,000       │ 1 assign    │
└────┴──────────────┴──────────────┴──────────────┴─────────────┘

Solution: ONE row per job+user, expandable to show details
```

### EXPANDED VIEW
```
┌────┬──────────────┬──────────────┬──────────────┬─────────────┐
│ ▼  │ JOB0002      │ Clerk 01     │ 20,000       │ 2 assigns   │
└────┴──────────────┴──────────────┴──────────────┴─────────────┘
     │
     └─► Individual Assignments:
         ┌─────────────┬──────────┬──────────┬─────────┬────────┐
         │ Assignment  │ Amount   │ Spent    │ Balance │ Status │
         ├─────────────┼──────────┼──────────┼─────────┼────────┤
         │ #89         │ 10,000   │ 9,500    │ 500     │ Settled│
         │ #87         │ 10,000   │ 10,200   │ 0       │ Settled│
         ├─────────────┼──────────┼──────────┼─────────┼────────┤
         │ TOTALS:     │ 20,000   │ 19,700   │ 500     │        │
         └─────────────┴──────────┴──────────┴─────────┴────────┘
```

## Database Structure

### Parent-Child Relationship
```
Main Assignment (Parent)
┌─────────────────────────────────────┐
│ assignmentId: 89                    │
│ jobId: JOB0002                      │
│ assignedTo: clerk01                 │
│ assignedAmount: 10,000              │
│ isMainAssignment: 1                 │
│ parentAssignmentId: NULL            │
└─────────────────────────────────────┘
         │
         ├─► Sub-Assignment 1
         │   ┌─────────────────────────────────────┐
         │   │ assignmentId: 87                    │
         │   │ jobId: JOB0002                      │
         │   │ assignedTo: clerk01                 │
         │   │ assignedAmount: 10,000              │
         │   │ isMainAssignment: 0                 │
         │   │ parentAssignmentId: 89              │
         │   └─────────────────────────────────────┘
         │
         └─► Sub-Assignment 2
             ┌─────────────────────────────────────┐
             │ assignmentId: 95                    │
             │ jobId: JOB0002                      │
             │ assignedTo: clerk01                 │
             │ assignedAmount: 5,000               │
             │ isMainAssignment: 0                 │
             │ parentAssignmentId: 89              │
             └─────────────────────────────────────┘

Total Amount: 10,000 + 10,000 + 5,000 = 25,000
```

## User Flow Diagrams

### Admin/Manager Flow: Creating Sub-Assignment

```
┌─────────────────────────────────────────────────────────────┐
│ 1. View Aggregated Assignments                              │
│    ┌────────────────────────────────────────────────────┐   │
│    │ ▶ JOB0002 | Clerk 01 | 20,000 | 2 assigns | [+Add]│   │
│    └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Click "+ Add" Button                                     │
│    Opens Modal:                                             │
│    ┌────────────────────────────────────────────────────┐   │
│    │ Add Sub-Assignment                                 │   │
│    │                                                    │   │
│    │ Job ID: JOB0002 (disabled)                        │   │
│    │ Assigned To: Clerk 01 (disabled)                  │   │
│    │ Amount: [_______] *                               │   │
│    │ Notes: [_______]                                  │   │
│    │                                                    │   │
│    │ [Cancel] [Create Sub-Assignment]                  │   │
│    └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Enter Amount (e.g., 5000) and Submit                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Updated View                                             │
│    ┌────────────────────────────────────────────────────┐   │
│    │ ▶ JOB0002 | Clerk 01 | 25,000 | 3 assigns | [+Add]│   │
│    └────────────────────────────────────────────────────┘   │
│    Total updated: 20,000 → 25,000                           │
│    Assignment count: 2 → 3                                  │
└─────────────────────────────────────────────────────────────┘
```

### Waff Clerk Flow: Viewing and Settling

```
┌─────────────────────────────────────────────────────────────┐
│ 1. View My Aggregated Assignments                           │
│    ┌────────────────────────────────────────────────────┐   │
│    │ ▶ JOB0002 | 25,000 | 3 assigns | Pending          │   │
│    └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Click Expand (▶) to View Details                        │
│    ┌────────────────────────────────────────────────────┐   │
│    │ ▼ JOB0002 | 25,000 | 3 assigns | Pending          │   │
│    └────────────────────────────────────────────────────┘   │
│    │                                                         │
│    └─► Individual Assignments:                              │
│        #89: 10,000 - Settled                                │
│        #87: 10,000 - Settled                                │
│        #95: 5,000  - Assigned (needs settlement)            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Settle Remaining Assignment (#95)                        │
│    Use existing settlement flow                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. All Settled                                              │
│    ┌────────────────────────────────────────────────────┐   │
│    │ ▶ JOB0002 | 25,000 | 3 assigns | All Settled      │   │
│    └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## API Request/Response Flow

### Get Aggregated Assignments

```
Request:
┌─────────────────────────────────────────────────────────────┐
│ GET /api/petty-cash-assignments/aggregated                  │
│ Authorization: Bearer <token>                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
Response:
┌─────────────────────────────────────────────────────────────┐
│ [                                                           │
│   {                                                         │
│     "groupKey": "JOB0002_clerk01",                         │
│     "jobId": "JOB0002",                                    │
│     "assignedTo": "clerk01",                               │
│     "assignedToName": "Clerk 01",                          │
│     "totalAssignedAmount": 25000,                          │
│     "totalActualSpent": 24500,                             │
│     "totalBalance": 500,                                   │
│     "totalOver": 0,                                        │
│     "allSettled": true,                                    │
│     "mainAssignmentId": 89,                                │
│     "assignments": [                                       │
│       {                                                    │
│         "assignmentId": 89,                                │
│         "assignedAmount": 10000,                           │
│         "actualSpent": 9500,                               │
│         "status": "Settled"                                │
│       },                                                   │
│       {                                                    │
│         "assignmentId": 87,                                │
│         "assignedAmount": 10000,                           │
│         "actualSpent": 10000,                              │
│         "status": "Settled"                                │
│       },                                                   │
│       {                                                    │
│         "assignmentId": 95,                                │
│         "assignedAmount": 5000,                            │
│         "actualSpent": 5000,                               │
│         "status": "Settled"                                │
│       }                                                    │
│     ]                                                      │
│   }                                                        │
│ ]                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Create Sub-Assignment

```
Request:
┌─────────────────────────────────────────────────────────────┐
│ POST /api/petty-cash-assignments/89/sub-assignment          │
│ Authorization: Bearer <token>                               │
│ Content-Type: application/json                              │
│                                                             │
│ {                                                           │
│   "assignedAmount": 5000,                                   │
│   "notes": "Additional transport costs"                     │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
Response:
┌─────────────────────────────────────────────────────────────┐
│ {                                                           │
│   "assignmentId": 95,                                       │
│   "jobId": "JOB0002",                                       │
│   "assignedTo": "clerk01",                                  │
│   "assignedBy": "admin01",                                  │
│   "assignedAmount": 5000,                                   │
│   "notes": "Additional transport costs",                    │
│   "isMainAssignment": 0,                                    │
│   "parentAssignmentId": 89,                                 │
│   "status": "Assigned",                                     │
│   "assignedDate": "2026-03-30T10:30:00Z"                   │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
PettyCashAggregated Component
│
├─► State Management
│   ├─ aggregatedAssignments (array)
│   ├─ expandedRows (Set)
│   ├─ showAssignModal (boolean)
│   ├─ selectedMainAssignment (object)
│   └─ assignFormData (object)
│
├─► Effects
│   └─ useEffect → fetchAggregatedAssignments()
│
├─► Functions
│   ├─ fetchAggregatedAssignments()
│   ├─ toggleRow(groupKey)
│   ├─ handleAddSubAssignment(group)
│   ├─ handleCreateSubAssignment(e)
│   ├─ formatCurrency(amount)
│   ├─ formatDate(dateString)
│   └─ getStatusBadgeClass(status)
│
└─► Render
    ├─ Page Header
    ├─ Message Display
    ├─ Aggregated Table
    │   ├─ Main Rows (collapsed)
    │   └─ Expanded Rows (with sub-assignments table)
    └─ Add Sub-Assignment Modal
```

## Color Coding

### Status Badges
```
┌─────────────┬──────────────┬─────────────────┐
│ Status      │ Color        │ Background      │
├─────────────┼──────────────┼─────────────────┤
│ Assigned    │ #856404      │ #fff3cd (yellow)│
│ Settled     │ #0c5460      │ #d1ecf1 (cyan)  │
│ Approved    │ #155724      │ #d4edda (green) │
│ Rejected    │ #721c24      │ #f8d7da (red)   │
│ Closed      │ #383d41      │ #e2e3e5 (gray)  │
└─────────────┴──────────────┴─────────────────┘
```

### Amount Display
```
┌─────────────┬──────────────┐
│ Type        │ Color        │
├─────────────┼──────────────┤
│ Balance     │ #27ae60 (green)│
│ Over Amount │ #e74c3c (red)  │
│ Regular     │ #2c3e50 (dark) │
└─────────────┴──────────────┘
```

## Responsive Breakpoints

```
Desktop (> 1200px)
┌────────────────────────────────────────────────────────────┐
│ Full table with all columns visible                        │
│ Comfortable spacing                                        │
└────────────────────────────────────────────────────────────┘

Tablet (768px - 1200px)
┌──────────────────────────────────────────────────┐
│ Slightly reduced padding                         │
│ All columns still visible                        │
└──────────────────────────────────────────────────┘

Mobile (< 768px)
┌────────────────────────────────┐
│ Horizontal scroll enabled      │
│ Table min-width: 900px         │
│ Modal: 95% width               │
└────────────────────────────────┘
```

## Animation Effects

### Expand/Collapse
```
Collapsed (▶)
┌────────────────────────────────┐
│ JOB0002 | Clerk 01 | 25,000    │
└────────────────────────────────┘
         │
         │ Click ▶
         ▼
Expanding (animation: 0.3s)
┌────────────────────────────────┐
│ JOB0002 | Clerk 01 | 25,000    │
├────────────────────────────────┤
│ [Sliding down...]              │
└────────────────────────────────┘
         │
         ▼
Expanded (▼)
┌────────────────────────────────┐
│ JOB0002 | Clerk 01 | 25,000    │
├────────────────────────────────┤
│ Individual Assignments:        │
│ #89: 10,000 - Settled          │
│ #87: 10,000 - Settled          │
│ #95: 5,000  - Assigned         │
│ Total: 25,000                  │
└────────────────────────────────┘
```

### Button Hover
```
Normal State:
[+ Add]

Hover State:
[+ Add] ← Lifts up 2px
        ← Shadow appears
        ← Slight scale increase
```

## Key Features Summary

✅ ONE row per job+user combination
✅ Total amount displayed prominently
✅ Assignment count badge
✅ Expand/collapse functionality
✅ Detailed breakdown when expanded
✅ Add sub-assignment capability
✅ Professional gradient design
✅ Smooth animations
✅ Responsive layout
✅ Status color coding
✅ Currency formatting
✅ Date formatting
✅ Role-based access control

## Benefits

1. **Cleaner Interface**: Reduces visual clutter
2. **Better Overview**: See totals at a glance
3. **Flexible Assignment**: Add multiple assignments easily
4. **Detailed When Needed**: Expand to see breakdown
5. **Professional Look**: Modern, polished design
6. **User-Friendly**: Intuitive expand/collapse
7. **Responsive**: Works on all devices
8. **Fast Performance**: Efficient data loading
