# Shared Settlement Items Design Document

## Requirement Analysis

### Current System:
- One Waff Clerk settles entire petty cash assignment at once
- All settlement items added in one transaction
- Assignment status changes to "Settled" after settlement

### New Requirement:
- Multiple Waff Clerks work on same job
- Each Waff Clerk can add settlement items for items they paid for
- Example: 10 predefined pay items
  - Waff Clerk 1 pays for items 1-6
  - Waff Clerk 2 pays for items 7-10
- Both can add custom items
- Track which Waff Clerk paid for each item
- Admin/Manager can see who paid for what

---

## Design Solution

### Database Changes

#### 1. Add `paidBy` column to `PettyCashSettlementItems`
```sql
ALTER TABLE PettyCashSettlementItems 
ADD paidBy VARCHAR(50) NULL;

ALTER TABLE PettyCashSettlementItems
ADD CONSTRAINT FK_SettlementItems_Users_PaidBy
FOREIGN KEY (paidBy) REFERENCES Users(userId);
```

#### 2. Create View for Settlement Items with User Details
```sql
CREATE VIEW vw_SettlementItemsWithUsers AS
SELECT 
    si.*,
    u.fullName as paidByName,
    pa.jobId,
    pa.assignedAmount
FROM PettyCashSettlementItems si
LEFT JOIN Users u ON si.paidBy = u.userId
INNER JOIN PettyCashAssignments pa ON si.assignmentId = pa.assignmentId;
```

---

## API Changes

### New Endpoints

#### 1. Add Settlement Items (Incremental)
```
POST /api/petty-cash-assignments/:assignmentId/settlement-items
```
**Body:**
```json
{
  "items": [
    {
      "itemName": "Fuel",
      "actualCost": 5000,
      "isCustomItem": false
    },
    {
      "itemName": "Parking Fee",
      "actualCost": 500,
      "isCustomItem": true
    }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "itemsAdded": 2,
  "totalSpent": 5500,
  "paidBy": "USER001",
  "paidByName": "John Doe"
}
```

#### 2. Get Settlement Items for Assignment
```
GET /api/petty-cash-assignments/:assignmentId/settlement-items
```
**Response:**
```json
{
  "assignmentId": 1,
  "jobId": "JOB0001",
  "assignedAmount": 10000,
  "totalSpent": 8500,
  "items": [
    {
      "settlementItemId": 1,
      "itemName": "Fuel",
      "actualCost": 5000,
      "isCustomItem": false,
      "paidBy": "USER001",
      "paidByName": "Waff Clerk 1",
      "createdDate": "2026-03-12T10:00:00"
    },
    {
      "settlementItemId": 2,
      "itemName": "Parking",
      "actualCost": 500,
      "isCustomItem": true,
      "paidBy": "USER001",
      "paidByName": "Waff Clerk 1",
      "createdDate": "2026-03-12T10:05:00"
    },
    {
      "settlementItemId": 3,
      "itemName": "Toll Fee",
      "actualCost": 3000,
      "isCustomItem": false,
      "paidBy": "USER002",
      "paidByName": "Waff Clerk 2",
      "createdDate": "2026-03-12T11:00:00"
    }
  ]
}
```

#### 3. Complete Settlement (Mark as Settled)
```
POST /api/petty-cash-assignments/:assignmentId/complete-settlement
```
**Body:**
```json
{
  "notes": "All items paid and verified"
}
```
**Response:**
```json
{
  "success": true,
  "assignmentId": 1,
  "status": "Settled",
  "totalSpent": 8500,
  "balanceAmount": 1500,
  "overAmount": 0
}
```

---

## Frontend Changes

### Settlement Modal - New Flow

#### Step 1: Load Predefined Pay Items
```javascript
// Load pay items based on job's shipment category
const loadPayItems = async (jobId) => {
  const job = jobs.find(j => j.jobId === jobId);
  const category = job.shipmentCategory;
  const templates = await payItemTemplateService.getByCategory(category);
  return templates;
};
```

#### Step 2: Show Items with Paid Status
```javascript
// Each item shows:
// - Item name
// - Estimated cost (from template)
// - Actual cost input (if not paid)
// - Paid by (if already paid)
// - Status: "Not Paid" | "Paid by [Name]"

const PayItemRow = ({ item, paidItems }) => {
  const paidItem = paidItems.find(p => p.itemName === item.name);
  
  if (paidItem) {
    return (
      <tr className="paid-item">
        <td>{item.name}</td>
        <td>LKR {item.estimatedCost}</td>
        <td>LKR {paidItem.actualCost}</td>
        <td className="paid-by">
          <span className="badge badge-success">
            Paid by {paidItem.paidByName}
          </span>
        </td>
      </tr>
    );
  }
  
  return (
    <tr>
      <td>{item.name}</td>
      <td>LKR {item.estimatedCost}</td>
      <td>
        <input 
          type="number" 
          placeholder="Enter actual cost"
          onChange={(e) => handleCostChange(item.name, e.target.value)}
        />
      </td>
      <td>
        <span className="badge badge-warning">Not Paid</span>
      </td>
    </tr>
  );
};
```

#### Step 3: Add Custom Items
```javascript
const addCustomItem = () => {
  setCustomItems([...customItems, {
    itemName: '',
    actualCost: 0,
    isCustomItem: true
  }]);
};
```

#### Step 4: Save Items (Incremental)
```javascript
const saveMyItems = async () => {
  // Only save items that current user filled in
  const myItems = items.filter(item => 
    item.actualCost > 0 && !item.paidBy
  );
  
  await pettyCashService.addSettlementItems(assignmentId, {
    items: myItems
  });
  
  // Reload to show updated status
  await loadSettlementItems();
};
```

#### Step 5: Complete Settlement (Admin/Manager Only)
```javascript
const completeSettlement = async () => {
  // Check if all required items are paid
  const unpaidItems = requiredItems.filter(item => 
    !paidItems.find(p => p.itemName === item.name)
  );
  
  if (unpaidItems.length > 0) {
    alert(`${unpaidItems.length} items are still unpaid`);
    return;
  }
  
  await pettyCashService.completeSettlement(assignmentId);
};
```

---

## User Flow Examples

### Scenario 1: Two Waff Clerks, Same Job

**Initial State:**
- Job JOB0001 assigned to Waff Clerk A and Waff Clerk B
- Both have petty cash assignments
- 10 predefined pay items for "Air Freight" category

**Waff Clerk A's Flow:**
1. Opens settlement modal for their assignment
2. Sees 10 predefined items (all "Not Paid")
3. Fills in actual costs for items 1-6
4. Adds 1 custom item "Extra Handling Fee"
5. Clicks "Save My Items"
6. Items 1-6 + custom item now show "Paid by Waff Clerk A"
7. Items 7-10 still show "Not Paid"

**Waff Clerk B's Flow:**
1. Opens settlement modal for their assignment
2. Sees 10 predefined items
   - Items 1-6 show "Paid by Waff Clerk A" (read-only)
   - Items 7-10 show "Not Paid" (can fill in)
3. Fills in actual costs for items 7-10
4. Clicks "Save My Items"
5. All 10 items now paid

**Manager's Flow:**
1. Views petty cash assignments
2. Sees both assignments for JOB0001
3. Clicks "View Settlement Details"
4. Sees all items with "Paid By" column:
   - Items 1-6: "Waff Clerk A"
   - Items 7-10: "Waff Clerk B"
   - Custom item: "Waff Clerk A"
5. Verifies all items paid
6. Clicks "Complete Settlement"
7. Both assignments marked as "Settled"

---

## Business Rules

1. **Incremental Settlement**: Waff Clerks can add items multiple times
2. **No Duplicate Items**: Can't add same predefined item twice
3. **Custom Items**: Can add multiple custom items
4. **Read-Only Paid Items**: Can't edit items paid by others
5. **Settlement Completion**: Only Admin/Manager can mark as "Settled"
6. **Auto-Calculate**: System calculates total spent, balance, over amount
7. **Job Status**: Job marked as "Settled" when ALL assignments settled

---

## Database Schema

### PettyCashSettlementItems (Updated)
```sql
CREATE TABLE PettyCashSettlementItems (
    settlementItemId INT IDENTITY(1,1) PRIMARY KEY,
    assignmentId INT NOT NULL,
    itemName NVARCHAR(200) NOT NULL,
    actualCost DECIMAL(18,2) NOT NULL,
    isCustomItem BIT DEFAULT 0,
    paidBy VARCHAR(50) NULL,  -- NEW COLUMN
    createdDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (assignmentId) REFERENCES PettyCashAssignments(assignmentId),
    FOREIGN KEY (paidBy) REFERENCES Users(userId)  -- NEW CONSTRAINT
);
```

---

## Benefits

1. **Flexibility**: Each Waff Clerk works independently
2. **Transparency**: Clear tracking of who paid what
3. **Accuracy**: No confusion about responsibilities
4. **Audit Trail**: Complete history of payments
5. **Collaboration**: Multiple people can work on same job
6. **Real-time Updates**: See what others have paid

---

## Implementation Steps

1. ✅ Create database migration script
2. ⏳ Update repository methods
3. ⏳ Create new use cases
4. ⏳ Update API endpoints
5. ⏳ Update frontend components
6. ⏳ Add UI for paid by column
7. ⏳ Test with multiple users
8. ⏳ Document for users

---

## Migration Path

### For Existing Data:
- Run migration script to add `paidBy` column
- Update existing settlement items with `paidBy = assignedTo` from assignment
- No data loss
- Backward compatible

### For New Settlements:
- Use new incremental flow
- Track paidBy for each item
- Allow multiple Waff Clerks to contribute

---

This design maintains backward compatibility while adding powerful new collaboration features!
