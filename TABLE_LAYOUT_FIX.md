# Pay Items Table Layout Fix

## Issue
The pay items table was appearing inside a nested card structure, creating a "two square" effect with unnecessary padding and borders. This made the table appear cramped and not extending to the full width of the section.

## Root Cause
The `.pay-items-card` class had:
- White background
- 2rem padding
- 2px border
- Border radius
- Box shadow

This created a visible inner card within the main card, causing the nested appearance.

## Solution
Removed the card styling from `.pay-items-card` to make it transparent and borderless:

### Before
```css
.pay-items-card {
  ba