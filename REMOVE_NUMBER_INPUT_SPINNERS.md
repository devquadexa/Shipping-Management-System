# Remove Number Input Spinners (Up/Down Arrows)

## Issue
Number input fields in the Invoicing and Petty Cash Management sections displayed up/down arrows (spinners). When users scrolled the page with the cursor focused on these fields, the values would change unintentionally, causing usability issues.

## Solution
Added CSS rules to remove the spinners from all number input fields across the application.

## Changes Made

### 1. Billing.css
**File**: `frontend/src/styles/Billing.css`

Added CSS to hide spinners:
```css
/* Remove number input spinners (up/down arrows) */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
```

### 2. PettyCash.css
**File**: `frontend/src/styles/PettyCash.css`

Added the same CSS rules to remove spinners from petty cash forms.

## Affected Fields

### Invoicing Section
- Actual Cost (LKR) input field
- Billing Amount (LKR) input field

### Petty Cash Management Section
- Actual Amount input field (in settlement form)
- Assigned Amount input field

## How It Works

The CSS uses browser-specific selectors:
- `-webkit-inner-spin-button` and `-webkit-outer-spin-button`: For Chrome, Safari, Edge
- `-moz-appearance: textfield`: For Firefox
- `appearance: textfield`: Standard property for other browsers

## Result
✅ No more up/down arrows on number inputs
✅ Users can only type values manually
✅ No accidental value changes when scrolling
✅ Cleaner, more professional appearance

## Testing
1. Go to Invoicing section
2. Click on Billing Amount field
3. Verify no arrows appear
4. Try scrolling - value should not change
5. Go to Petty Cash Management
6. Click Settle on an assignment
7. Enter actual amounts - no arrows should appear
