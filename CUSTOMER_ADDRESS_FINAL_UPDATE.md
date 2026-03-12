# Customer Address Structure - Final Update

## Overview
Complete restructuring of customer address system according to standard Sri Lankan address format with the following changes:

1. ✅ Removed dropdown dependencies (no more city/district dropdowns)
2. ✅ Added proper Sri Lankan address structure
3. ✅ Separate office address with same structure
4. ✅ Dropped old address columns and cleared existing data
5. ✅ Store city and district names directly (not IDs)

## Standard Sri Lankan Address Format Implemented

Based on research of official Sri Lankan postal standards:

### Residential Address:
- **Address Number**: House/Building number (e.g., "45", "123/2A", "No. 67")
- **Street Name 1**: Main street/road name (e.g., "Galle Road", "Temple Road")
- **Street Name 2**: Additional street info - OPTIONAL (e.g., "Lane 3", "Near School")
- **City/Town**: City or town name (e.g., "Colombo", "Kandy", "Galle")
- **District**: District name (e.g., "Colombo", "Kandy", "Galle")

### Office Address:
- Same structure as residential
- Option to mark "same as residential address"

## Database Changes

### 1. Run the Update Script
```sql
-- File: backend-api/src/config/UPDATE_CUSTOMER_ADDRESS_STRUCTURE.sql
```

This script will:
- ✅ Clear all existing customer data (as requested)
- ✅ Drop old address columns (Address, OfficeLocation, etc.)
- ✅ Add new structured address columns
- ✅ Create performance indexes

### 2. New Database Structure

**Customers Table - New Address Columns:**
```sql
-- Residential Address
addressNumber NVARCHAR(20) NOT NULL
addressStreet1 NVARCHAR(200) NOT NULL  -- Main street
addressStreet2 NVARCHAR(200)           -- Additional street (optional)
addressCity NVARCHAR(100) NOT NULL
addressDistrict NVARCHAR(100) NOT NULL

-- Office Address
officeAddressNumber NVARCHAR(20)
officeAddressStreet1 NVARCHAR(200)
officeAddressStreet2 NVARCHAR(200)
officeAddressCity NVARCHAR(100)
officeAddressDistrict NVARCHAR(100)

-- Flag
isOfficeAddressSame BIT DEFAULT 0
```

## Backend Changes

### 1. Updated Customer Entity
- ✅ New address properties
- ✅ Validation for all required fields
- ✅ Helper methods for formatted addresses
- ✅ Office address validation (when not same as residential)

### 2. Updated Customer Repository
- ✅ Create/Update methods with new fields
- ✅ Simplified queries (no more JOINs with Cities/Districts)
- ✅ Direct storage of city/district names

### 3. Removed Location Routes
Since we're storing names directly, the location API endpoints are no longer needed.

## Frontend Changes

### 1. Updated Customer Form
- ✅ Residential address section with proper Sri Lankan format
- ✅ Office address section (shows/hides based on checkbox)
- ✅ Proper validation for all required fields
- ✅ User-friendly placeholders and help text

### 2. Updated Customer Display
- ✅ Shows formatted residential address
- ✅ Shows office address or "Same as residential"
- ✅ Clean, professional display

### 3. Form Structure
```javascript
// Residential Address
addressNumber: '',
addressStreet1: '',
addressStreet2: '',
addressCity: '',
addressDistrict: '',

// Office Address
officeAddressNumber: '',
officeAddressStreet1: '',
officeAddressStreet2: '',
officeAddressCity: '',
officeAddressDistrict: '',
isOfficeAddressSame: false
```

## Implementation Steps

### 1. Database Update
```bash
# Run the SQL script in SSMS
backend-api/src/config/UPDATE_CUSTOMER_ADDRESS_STRUCTURE.sql
```

### 2. Backend Update
- ✅ Customer entity updated
- ✅ Repository updated
- ✅ No location routes needed

### 3. Frontend Update
- ✅ Form updated with new structure
- ✅ Display updated
- ✅ Validation updated

### 4. Test the System
1. Restart backend server
2. Create new customer with structured address
3. Verify address display
4. Test office address functionality

## Address Examples

### Residential Address Example:
```
Address Number: 45
Street Name 1: Galle Road
Street Name 2: Lane 3
City: Colombo
District: Colombo

Formatted: "45, Galle Road, Lane 3, Colombo, Colombo"
```

### Office Address Example:
```
Option 1: Same as residential (checkbox checked)
Option 2: Different address with same structure
```

## Benefits

1. **Standard Format**: Follows official Sri Lankan postal format
2. **No Dependencies**: No need for city/district lookup tables
3. **Flexibility**: Users can enter any city/district name
4. **Professional**: Clean, structured address display
5. **User-Friendly**: Clear form with helpful placeholders
6. **Efficient**: Direct storage, no complex JOINs

## Validation Rules

### Required Fields:
- Address Number
- Street Name 1
- City
- District

### Optional Fields:
- Street Name 2 (additional street info)

### Office Address:
- If "same as residential" is checked: no office fields required
- If unchecked: all office address fields become required

## Address Display Format

**Residential:** `{number}, {street1}, {street2}, {city}, {district}`
**Office:** Same format or "Same as residential address"

## Migration Notes

- ✅ All existing customer data will be cleared (as requested)
- ✅ Fresh start with new address structure
- ✅ No backward compatibility needed
- ✅ Clean database structure

This implementation provides a professional, standardized address system that follows Sri Lankan postal conventions while being user-friendly and efficient.