# Stock Verification Module - Integration Plan

## Current Status
✅ Database schema fully defined
✅ Campaign service partially implemented
✅ API routes structure exists
⚠️ UI components need completion
⚠️ Integration with asset lifecycle needed

## Integration with Existing Modules

### 1. Asset Lifecycle Integration
```
Asset Created (Procurement)
    ↓
Asset Deployed (IN_USE)
    ↓
VERIFICATION CAMPAIGN → Verify Asset → Update Status
    ↓
Discrepancies Found → Maintenance or Disposal
    ↓
AssetVeritifation Record Created
```

### 2. Key Features to Implement

#### A. Campaign Management (HIGH PRIORITY)
- **List Campaigns**: `/stock-verification/campaigns`
- **Create Campaign**: `/stock-verification/campaigns/new`
- **Campaign Detail**: `/stock-verification/campaigns/[id]`
- **Assign Team Members**: Team assignment interface
- **Track Progress**: Real-time campaign progress

#### B. Asset Verification (HIGH PRIORITY)
- **Verification Interface**: Mobile-friendly asset verification
- **QR Code Scanning**: Quick asset identification
- **Photo Evidence**: Upload verification photos
- **Condition Assessment**: Record asset condition
- **Location Verification**: Confirm/update location

#### C. Discrepancy Management (MEDIUM)
- **Report Discrepancy**: Quick discrepancy reporting
- **Assign Resolution**: Assign discrepancies to team
- **Track Status**: Monitor resolution progress
- **Resolution Actions**: Link to Maintenance/Disposal

#### D. Reporting & Analytics (MEDIUM)
- **Campaign Dashboard**: KPIs and progress
- **Verification Rate**: Assets verified vs pending
- **Discrepancy Analysis**: Types and frequency
- **Team Performance**: Individual/team metrics

### 3. Status-Aware Integration

#### Verification Rules by Asset Status
```typescript
IN_STORE → Can verify (location, condition)
IN_USE → Can verify (location, condition, user)
MAINTENANCE → Can verify but flag for re-check
DISPOSED → Cannot verify (excluded from campaigns)
MISSING → Special verification flow (recovery/write-off)
```

#### Auto-Status Updates
```typescript
Verified + Condition Good → Status unchanged
Verified + Missing → Status = MISSING
Verified + Damaged → Create Maintenance Request
Verified + Beyond Repair → Create Disposal Request
```

### 4. Cross-Module Actions

#### From Verification to Maintenance
```typescript
if (condition === 'DAMAGED' || condition === 'NEEDS_REPAIR') {
  createMaintenanceRequest({
    assetId,
    title: `Verification: ${discrepancyType}`,
    description: verificationNotes,
    priority: calculatePriority(severity),
    images: verificationPhotos
  });
}
```

#### From Verification to Disposal
```typescript
if (condition === 'BEYOND_REPAIR' || recommendation === 'DISPOSE') {
  createDisposalRequest({
    assetId,
    reason: 'DAMAGED',
    description: `Verification identified: ${discrepancyNotes}`,
  });
}
```

## Implementation Phases

### Phase 1: Core Campaign Management (1-2 hours)
- [x] Database schema (already done)
- [ ] Campaign listing page
- [ ] Create campaign form
- [ ] Campaign detail view
- [ ] Team assignment interface

### Phase 2: Verification Interface (2-3 hours)
- [ ] Asset verification form
- [ ] QR code integration
- [ ] Photo upload
- [ ] Condition assessment
- [ ] Quick actions (create maintenance/disposal)

### Phase 3: Discrepancy Tracking (1-2 hours)
- [ ] Discrepancy list
- [ ] Discrepancy detail
- [ ] Assignment workflow
- [ ] Resolution tracking

### Phase 4: Reporting Dashboard (1-2 hours)
- [ ] Campaign analytics
- [ ] Team performance metrics
- [ ] Verification progress charts
- [ ] Export reports

### Phase 5: Mobile Optimization (1 hour)
- [ ] Responsive verification form
- [ ] Offline capability
- [ ] Camera integration
- [ ] GPS location capture

## Quick Wins (Implement First)

### 1. Campaign Listing with Stats
```
Route: /stock-verification/campaigns

Show:
- Active campaigns
- Progress percentage
- Assets verified/total
- Team members assigned
- Quick create button
```

### 2. Simple Verification Form
```
Route: /stock-verification/campaigns/[id]/verify

Fields:
- Asset selector (QR scan or dropdown)
- Condition (Good/Fair/Poor/Damaged)
- Location verification (confirm/update)
- Notes
- Photos (optional)
- Actions: Mark as verified / Report issue
```

### 3. Integration with System Overview
```
Add to /reports/overview:

Verification Card showing:
- Active campaigns
- Today's verifications
- Pending discrepancies
- Link to module
```

## API Endpoints to Create

### Campaigns
- `GET /api/stock-verification/campaigns` - List campaigns
- `POST /api/stock-verification/campaigns` - Create campaign
- `GET /api/stock-verification/campaigns/[id]` - Get campaign
- `PATCH /api/stock-verification/campaigns/[id]` - Update campaign
- `DELETE /api/stock-verification/campaigns/[id]` - Delete campaign

### Verifications
- `GET /api/stock-verification/verifications` - List verifications
- `POST /api/stock-verification/verifications` - Create verification
- `GET /api/stock-verification/verifications/[id]` - Get verification
- `PATCH /api/stock-verification/verifications/[id]` - Update verification

### Discrepancies
- `GET /api/stock-verification/discrepancies` - List discrepancies
- `POST /api/stock-verification/discrepancies` - Create discrepancy
- `PATCH /api/stock-verification/discrepancies/[id]` - Resolve/assign

## Testing Strategy

### Unit Tests
- Campaign creation validates dates
- Asset assignment logic
- Progress calculation
- Status transitions

### Integration Tests
- Create campaign → Assign team → Verify assets → Complete
- Find discrepancy → Create maintenance request
- Verify all assets → Campaign completion flow

### E2E Tests
- Full verification workflow
- Photo upload and retrieval
- Discrepancy resolution flow

## Success Metrics

### Technical
- [ ] All CRUD operations for campaigns
- [ ] Verification creates proper records
- [ ] Discrepancies link to maintenance/disposal
- [ ] Status updates propagate correctly

### User Experience
- [ ] Campaign creation under 2 minutes
- [ ] Asset verification under 30 seconds
- [ ] Mobile-friendly interface
- [ ] Offline capability

### Integration
- [ ] Shows in system overview dashboard
- [ ] Links to maintenance module
- [ ] Links to disposal module
- [ ] Asset history shows verifications

## Next Steps

1. **Immediate**: Create campaign listing page
2. **Short-term**: Build verification form
3. **Medium-term**: Add to system overview
4. **Long-term**: Mobile app with offline sync
