# Module Alignment & Integration Plan

## Current Issues Identified
1. **No Approval Workflow**: Procurement requests show as "PENDING" with no way to approve/reject
2. **Disconnected Modules**: Procurement doesn't create assets, maintenance doesn't check asset status
3. **Missing Links**: No Purchase Order management or receiving interface
4. **No Asset Lifecycle**: Assets aren't linked back to their procurement source

## Proposed Integration Architecture

### 1. Procurement → Asset Creation Flow
```
Requisition (PENDING) 
  → Approval (Manager/Admin) 
  → Purchase Order Creation
  → PO Approval/Sending
  → Receiving Items
  → Asset Creation (Auto)
```

### 2. Asset Status Lifecycle
```
IN_STORE (Created from Procurement)
  ↓
IN_USE (Assigned/Deployed)
  ↓
MAINTENANCE (Work Order Active)
  ↓
IN_USE / IN_STORE (Maintenance Complete)
  ↓
DISPOSED (Disposal Complete)
```

### 3. Cross-Module Integration Points

#### Procurement → Assets
- ProcurementRequest approval workflow
- PurchaseOrder creation & management
- Receiving interface creates Assets with proper references
- Asset.procurementRequestId link

#### Assets → Maintenance
- Only show ACTIVE assets (not DISPOSED)
- Update asset status when work order created
- Link maintenance cost to asset history

#### Assets → Disposal
- Only allow disposal of IN_STORE/IN_USE assets
- Update asset status to DISPOSED
- Track disposal proceeds

## Implementation Tasks

### Phase 1: Approval Workflow (HIGH PRIORITY)
- [ ] Create `/procurement/requests/[id]/page.tsx` - Detail/Approval view
- [ ] Add `approveProcurementRequest` action
- [ ] Add `rejectProcurementRequest` action
- [ ] Show "Approve/Reject" buttons for managers
- [ ] Add approved/rejected by tracking

### Phase 2: Purchase Order Management
- [ ] Create `/procurement/purchase-orders/page.tsx` - PO List
- [ ] Create `/procurement/purchase-orders/new/page.tsx` - Create PO from Request
- [ ] Create `/procurement/purchase-orders/[id]/page.tsx` - PO Details
- [ ] Create `/procurement/purchase-orders/[id]/receive/page.tsx` - Receiving UI
- [ ] Update `procurementService` with PO queries

### Phase 3: Asset Creation from Procurement
- [ ] Add `procurementRequestId` to Asset model
- [ ] Update `receiveItems` to properly link assets
- [ ] Show procurement source in Asset details
- [ ] Track "Assets Created" count on Procurement dashboard

### Phase 4: Status Synchronization
- [ ] Update maintenance to filter by asset status
- [ ] Change asset status when work order is created
- [ ] Change asset status when disposal is finalized
- [ ] Add status history tracking

### Phase 5: Reporting & Dashboard
- [ ] Create unified dashboard showing all module stats
- [ ] Add "Asset Lifecycle" report
- [ ] Add "Procurement to Asset" report
- [ ] Add "Total Cost of Ownership" view

## Database Schema Changes Required

```prisma
// Add to Asset model
model Asset {
  // ... existing fields
  procurementRequestId  Int?  @map("procurement_request_id")
  purchaseOrderId       Int?  @map("purchase_order_id")
  
  procurementRequest    ProcurementRequest? @relation(fields: [procurementRequestId], references: [id])
  purchaseOrder         PurchaseOrder?      @relation(fields: [purchaseOrderId], references: [id])
}

// Add to ProcurementRequest
model ProcurementRequest {
  // ... existing fields
  approvedBy        Int?      @map("approved_by")
  approvedAt        DateTime? @map("approved_at")
  rejectedBy        Int?      @map("rejected_by")
  rejectedAt        DateTime? @map("rejected_at")
  rejectionReason   String?   @db.Text
  
  approver          User? @relation("ApprovedRequests", fields: [approvedBy], references: [id])
  rejector          User? @relation("RejectedRequests", fields: [rejectedBy], references: [id])
  createdAssets     Asset[]
}

// Add to PurchaseOrder
model PurchaseOrder {
  // ... existing fields
  createdAssets     Asset[]
}
```

## Quick Wins (Can implement immediately)

1. **Add Approval Buttons**: Show approve/reject on procurement request details
2. **Filter Assets**: Only show non-disposed assets in maintenance
3. **Status Badges**: Add proper color coding for all statuses
4. **Breadcrumbs**: Add navigation breadcrumbs showing the workflow stage
5. **Activity Feed**: Show recent actions across all modules on dashboard
