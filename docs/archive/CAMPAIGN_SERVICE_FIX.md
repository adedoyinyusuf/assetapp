# Backend Fix for Campaign Service

## Problem
The frontend is receiving runtime errors because the campaign data from the backend doesn't include:
- `verificationProgress` (number)
- `actualAssetCount` (number)
- `_count.discrepancies` (number)

## Solution
Modify the `getCampaignById` method in `lib/stock-verification/campaign-service.ts` around line 267-271.

### Current Code (lines 261-271):
```typescript
      // Get comprehensive statistics
      const stats = await this.getCampaignStatistics(campaignId);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(campaignId);

      return {
        ...campaign,
        stats,
        recentActivity,
      };
```

### Replace With:
```typescript
      // Get comprehensive statistics
      const stats = await this.getCampaignStatistics(campaignId);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(campaignId);

      // Calculate progress percentage
      const verifiedCount = stats.verifiedAssets || 0;
      const targetCount = campaign.targetAssetCount || 0;
      const verificationProgress = targetCount > 0 ? (verifiedCount / targetCount) * 100 : 0;

      return {
        ...campaign,
        stats,
        recentActivity,
        verificationProgress,
        actualAssetCount: verifiedCount,
        _count: {
          discrepancies: stats.discrepancyCount || 0,
          verifications: campaign._count?.verifications || 0,
          assignments: campaign._count?.assignments || 0,
        },
      };
```

## What This Does:
1. **verificationProgress**: Calculates the percentage of verified assets out of the target
2. **actualAssetCount**: Provides the count of verified assets
3. **_count.discrepancies**: Includes the discrepancy count in the response

## To Apply the Fix:
1. Open `c:\Apps\assetapp\lib\stock-verification\campaign-service.ts`
2. Find the `getCampaignById` method (around line 208-275)
3. Locate the `return` statement (line 267-271)
4. Replace with the code above

The errors will be resolved once the backend provides these calculated fields!
