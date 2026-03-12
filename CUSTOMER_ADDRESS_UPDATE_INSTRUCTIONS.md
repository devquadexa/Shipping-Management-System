# Customer Address Structure Update

## Overview
Updated customer address to use a standard Sri Lankan format with dropdowns for districts and cities.

## New Address Structure
- **House/Building Number**: e.g., "123", "45/2A"
- **Street Name**: e.g., "Galle Road", "Main Street"
- **City/Town**: Dropdown with Sri Lankan cities
- **District**: Dropdown with Sri Lankan districts
- **Additional Details**: Optional field for extra information

## Implementation Steps

### 1. Database Changes
Run this SQL script to add location tables and update customer structure:
```sql
-- File: backend-api/src/config/ADD_SRI_LANKA_LOCATIONS.sql
```

This script will:
- Create `Districts` table with 25 Sri Lankan districts
- Create `Cities` table with major cities and towns
- Add new address columns to `Customers` table
- Insert sample data for districts and cities

### 2. Backend API Changes
- ✅ Added new location routes (`/api/locations/`)
- ✅ Updated Customer entity with new address fields
- ✅ Updated Customer repository to handle structured addresses
- ✅ Added location endpoints for districts and cities

### 3. Frontend Changes
- ✅ Updated customer form with structured address fields
- ✅ Added district and city dropdowns
- ✅ Updated address display to show formatted address
- ✅ Maintained backward compatibility with legacy address field

## Features

### District and City Dropdowns
- **Districts**: Shows all 25 Sri Lankan districts with provinces
- **Cities**: Dynamically loads based on selected district
- **Validation**: Both district and city are required

### Address Display
- Shows formatted address: "123, Galle Road, Colombo, Colombo"
- Falls back to legacy address if structured data not available
- Shows additional details separately if provided

### Backward Compatibility
- Existing customers with legacy addresses still work
- Legacy address field kept as "Additional Details"
- System supports both old and new address formats

## Data Included

### Districts (25 total)
- **Western Province**: Colombo, Gampaha, Kalutara
- **Central Province**: Kandy, Matale, Nuwara Eliya
- **Southern Province**: Galle, Matara, Hambantota
- **Northern Province**: Jaffna, Kilinochchi, Mannar, Mullaitivu, Vavuniya
- **Eastern Province**: Batticaloa, Ampara, Trincomalee
- **North Western Province**: Kurunegala, Puttalam
- **North Central Province**: Anuradhapura, Polonnaruwa
- **Uva Province**: Badulla, Monaragala
- **Sabaragamuwa Province**: Ratnapura, Kegalle

### Cities (90+ major cities and towns)
- Major cities in each district
- Includes suburbs and important towns
- Covers all major commercial centers

## Usage

### For New Customers
1. Select district from dropdown
2. Select city from filtered list
3. Enter house number and street name
4. Optionally add additional details

### For Existing Customers
- Legacy addresses still display correctly
- Can be updated to use new structure when editing
- No data loss during transition

## API Endpoints

### Get Districts
```
GET /api/locations/districts
```

### Get Cities by District
```
GET /api/locations/cities/:districtId
```

### Get All Cities
```
GET /api/locations/cities
```

## Testing

1. **Run the SQL script** to add location data
2. **Restart backend server** to load new routes
3. **Test creating new customer** with structured address
4. **Test editing existing customer** to verify backward compatibility
5. **Verify address display** shows formatted addresses correctly

## Benefits

1. **Standardized Addresses**: Consistent format across all customers
2. **Better Data Quality**: Dropdowns prevent typos and inconsistencies
3. **Improved Search**: Can filter customers by district/city
4. **Professional Appearance**: Clean, structured address display
5. **Sri Lankan Context**: Uses actual Sri Lankan administrative divisions

## Future Enhancements

- Add postal codes
- Include more cities and towns
- Add address validation
- Integrate with mapping services
- Export customer lists by location