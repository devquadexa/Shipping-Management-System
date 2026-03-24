# Vehicle Shipment Form Changes - Quick Reference

## What Changed?

Container Number field is now **hidden** for vehicle shipments since vehicles don't use containers.

## Visual Guide

### ❌ BEFORE: Confusing for Vehicle Shipments
```
┌──────────────────────────────────────────────────────────┐
│ SHIPMENT DETAILS                                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Shipment Category *                                      │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Vehicle - Personal                                ▼ ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│ Chassis Number                                           │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Vehicle chassis number                               ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│ LC Number                                                │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Letter of Credit Number                              ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│ Container Number  ← ❌ CONFUSING! Vehicles don't use    │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Container Number                                     ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### ✅ AFTER: Clean and Relevant
```
┌──────────────────────────────────────────────────────────┐
│ SHIPMENT DETAILS                                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Shipment Category *                                      │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Vehicle - Personal                                ▼ ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│ Chassis Number                                           │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Vehicle chassis number                               ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│ LC Number                                                │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Letter of Credit Number                              ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│ ✅ Container Number field hidden (not needed for vehicles)│
│                                                           │
│ Exporter                                                 │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Exporter name                                        ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## When Does Container Number Show?

### ✅ Shows for These Categories:
- LCL (Loose Cargo Load)
- FCL (Full Container Load)
- Air Freight
- BOI
- TIEP

### ❌ Hidden for These Categories:
- Vehicle - Personal
- Vehicle - Company

## Smart Auto-Clear Feature

### Scenario: User Changes Mind
```
Step 1: User selects "FCL"
        ↓
        Container Number field appears
        ↓
Step 2: User enters "CONT123456"
        ↓
Step 3: User changes to "Vehicle - Personal"
        ↓
        ✅ Container Number field disappears
        ✅ Container Number value automatically cleared
        ✅ Chassis Number field appears
```

## Quick Comparison Table

| Category           | Chassis Number | Container Number |
|--------------------|----------------|------------------|
| LCL                | Hidden         | **Visible** ✅   |
| FCL                | Hidden         | **Visible** ✅   |
| Air Freight        | Hidden         | **Visible** ✅   |
| BOI                | Hidden         | **Visible** ✅   |
| Vehicle - Personal | **Visible** ✅ | Hidden           |
| Vehicle - Company  | **Visible** ✅ | Hidden           |
| TIEP               | Hidden         | **Visible** ✅   |

## Benefits

### 🎯 Cleaner Forms
Only relevant fields shown for each shipment type

### ⚡ Faster Data Entry
No need to skip irrelevant fields

### ✅ Better Data Quality
Prevents entering container numbers for vehicles

### 👍 Professional Appearance
Industry-standard form behavior

## No Action Required

This change is automatic. Users will see the updated form immediately after deployment.

---

**Status**: ✅ Complete and ready for deployment
