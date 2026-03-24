# Container Number Conditional Display - Vehicle Shipments

## Overview
Container Number field is now hidden when the shipment category is "Vehicle - Personal" or "Vehicle - Company" since vehicles are not shipped in containers.

## Business Logic

### Shipment Categories
- **LCL** (Loose Cargo Load) → Shows Container Number ✅
- **FCL** (Full Container Load) → Shows Container Number ✅
- **Air Freight** → Shows Container Number ✅
- **BOI** → Shows Container Number ✅
- **Vehicle - Personal** → Hides Container Number ❌
- **Vehicle - Company** → Hides Container Number ❌
- **TIEP** → Shows Container Number ✅

### Why This Change?
Vehicles are shipped individually and do not use containers. Instead, they use:
- Chassis Number (vehicle-specific identifier)
- BL Number (Bill of Lading)
- Other vehicle-specific documentation

Showing a "Container Number" field for vehicle shipments was confusing and unnecessary.

## Implementation Details

### File Modified
`frontend/src/components/Jobs.js`

### Changes Made

#### 1. Conditional Field Display
Added conditional rendering to hide Container Number field for vehicle shipments:

```javascript
{/* Hide Container Number for Vehicle shipments */}
{!(formData.shipmentCategory === 'Vehicle - Personal' || formData.shipmentCategory === 'Vehicle - Company') && (
  <div className="form-group">
    <label>Container Number</label>
    <input 
      type="text" 
      name="containerNumber" 
      value={formData.containerNumber} 
      onChange={handleChange} 
      placeholder="Container Number" 
    />
  </div>
)}
```

#### 2. Auto-Clear Container Number
Updated `handleChange` function to automatically clear container number when switching to vehicle categories:

```javascript
if (name === 'shipmentCategory') {
  const isVehicleCategory = value === 'Vehicle - Personal' || value === 'Vehicle - Company';
  return {
    ...prev,
    shipmentCategory: value,
    chassisNumber: isVehicleCategory ? prev.chassisNumber : '',
    containerNumber: isVehicleCategory ? '' : prev.containerNumber // Clear for vehicles
  };
}
```

## User Experience Flow

### Scenario 1: Creating New Job with Vehicle Category

```
1. User opens "Add New Job" form
2. User selects "Vehicle - Personal" from Shipment Category
   ↓
3. Form updates:
   ✅ Chassis Number field appears
   ❌ Container Number field disappears
   ✅ Container Number value cleared (if any)
```

### Scenario 2: Switching from Non-Vehicle to Vehicle

```
1. User has entered data for LCL shipment
   - Container Number: "CONT123456"
2. User changes Shipment Category to "Vehicle - Company"
   ↓
3. Form updates:
   ✅ Chassis Number field appears
   ❌ Container Number field disappears
   ✅ Container Number value cleared automatically
```

### Scenario 3: Switching from Vehicle to Non-Vehicle

```
1. User has entered data for Vehicle shipment
   - Chassis Number: "VIN123456"
2. User changes Shipment Category to "FCL"
   ↓
3. Form updates:
   ❌ Chassis Number field disappears
   ✅ Container Number field appears
   ✅ Chassis Number value cleared automatically
   ✅ User can now enter Container Number
```

## Visual Comparison

### Before: All Categories Show Container Number
```
┌─────────────────────────────────────────────────────┐
│ SHIPMENT DETAILS                                    │
├─────────────────────────────────────────────────────┤
│ Shipment Category: [Vehicle - Personal ▼]          │
│                                                      │
│ Chassis Number:    [Vehicle chassis number____]     │
│ LC Number:         [Letter of Credit Number___]     │
│ Container Number:  [Container Number__________] ❌  │
│ Exporter:          [Exporter name_____________]     │
└─────────────────────────────────────────────────────┘
```

### After: Vehicle Categories Hide Container Number
```
┌─────────────────────────────────────────────────────┐
│ SHIPMENT DETAILS                                    │
├─────────────────────────────────────────────────────┤
│ Shipment Category: [Vehicle - Personal ▼]          │
│                                                      │
│ Chassis Number:    [Vehicle chassis number____]     │
│ LC Number:         [Letter of Credit Number___]     │
│ (Container Number field hidden) ✅                  │
│ Exporter:          [Exporter name_____________]     │
└─────────────────────────────────────────────────────┘
```

### For Non-Vehicle Categories (e.g., FCL)
```
┌─────────────────────────────────────────────────────┐
│ SHIPMENT DETAILS                                    │
├─────────────────────────────────────────────────────┤
│ Shipment Category: [FCL ▼]                         │
│                                                      │
│ (Chassis Number field hidden)                       │
│ LC Number:         [Letter of Credit Number___]     │
│ Container Number:  [Container Number__________] ✅  │
│ Exporter:          [Exporter name_____________]     │
└─────────────────────────────────────────────────────┘
```

## Field Visibility Matrix

| Shipment Category | Chassis Number | Container Number |
|-------------------|----------------|------------------|
| LCL               | ❌ Hidden      | ✅ Visible       |
| FCL               | ❌ Hidden      | ✅ Visible       |
| Air Freight       | ❌ Hidden      | ✅ Visible       |
| BOI               | ❌ Hidden      | ✅ Visible       |
| Vehicle - Personal| ✅ Visible     | ❌ Hidden        |
| Vehicle - Company | ✅ Visible     | ❌ Hidden        |
| TIEP              | ❌ Hidden      | ✅ Visible       |

## Benefits

### For Users
- ✅ Cleaner, more intuitive form
- ✅ No confusion about irrelevant fields
- ✅ Faster data entry
- ✅ Reduced errors

### For Business
- ✅ Better data quality
- ✅ Appropriate fields for each shipment type
- ✅ Professional appearance
- ✅ Industry-standard practices

### For Data Integrity
- ✅ Prevents invalid data entry
- ✅ Auto-clears inappropriate values
- ✅ Maintains consistency
- ✅ Reduces validation errors

## Technical Details

### Conditional Rendering Logic
```javascript
// Show Container Number ONLY if NOT a vehicle category
!(formData.shipmentCategory === 'Vehicle - Personal' || 
  formData.shipmentCategory === 'Vehicle - Company')
```

### Auto-Clear Logic
```javascript
// When switching TO vehicle category
if (isVehicleCategory) {
  containerNumber = '' // Clear the value
}

// When switching FROM vehicle category
if (!isVehicleCategory) {
  chassisNumber = '' // Clear the value
}
```

## Testing Checklist

### Functional Testing
- [ ] Container Number hidden for "Vehicle - Personal"
- [ ] Container Number hidden for "Vehicle - Company"
- [ ] Container Number visible for all other categories
- [ ] Container Number value cleared when switching to vehicle
- [ ] Chassis Number appears for vehicle categories
- [ ] Chassis Number cleared when switching from vehicle

### UI Testing
- [ ] Form layout adjusts properly
- [ ] No empty gaps in form
- [ ] Responsive design maintained
- [ ] Mobile view works correctly

### Data Testing
- [ ] Existing jobs display correctly
- [ ] New jobs save correctly
- [ ] Edit job maintains correct fields
- [ ] No validation errors

### Edge Cases
- [ ] Switching between categories multiple times
- [ ] Editing existing vehicle jobs
- [ ] Editing existing non-vehicle jobs
- [ ] Form reset works correctly

## Deployment

No backend changes required. Frontend-only change.

```bash
# Deploy frontend
cd frontend
npm install
docker restart cargo_frontend
```

## Backward Compatibility

### Existing Data
- Jobs with vehicle categories that have container numbers will still display the data in view mode
- When editing, the container number field will be hidden
- Container number value will be cleared if user saves the form

### No Database Changes
- No schema changes required
- No data migration needed
- Existing data remains intact

## Future Enhancements

### Potential Additions
- Add more vehicle-specific fields (e.g., VIN, Make, Model)
- Add validation to prevent container number for vehicles at backend
- Add tooltips explaining why fields appear/disappear
- Add field-specific help text

## Status

✅ **COMPLETE** - Container Number field now conditionally displays based on shipment category. Vehicle shipments no longer show the irrelevant Container Number field.

## Files Modified

1. ✅ `frontend/src/components/Jobs.js` - Added conditional rendering and auto-clear logic

## Summary

This change improves the user experience by showing only relevant fields for each shipment type. Vehicle shipments now have a cleaner form without the confusing Container Number field, while maintaining all necessary vehicle-specific fields like Chassis Number.
