# Verifications API Hanging - Debugging Guide

## Problem Summary
The `/api/stock-verification/verifications` API endpoint is hanging (showing "Pending" status in browser Network tab), causing the Verifications page to remain stuck on "Loading asset verifications...".

## Root Cause Analysis

Based on code review, the likely issue is in the **`buildUserAccessFilter`** method in `base-service.ts`. This method:

1. Queries the database for user assignments
2. Returns a filter based on campaign IDs the user has access to
3. If the user has NO assignments, it returns `{ campaignId: { in: [] } }`

### The Problem
When `campaignId: { in: [] }` is used in a Prisma query, it can cause performance issues or hang in some database configurations because Prisma may not optimize empty `in` clauses well.

## Recommended Fix

### Option 1: Early Return for No Access (RECOMMENDED)

Modify the `getVerifications` method in `verification-service.ts` to check for empty access before querying:

```typescript
async getVerifications(
  params: VerificationQueryParams,
  userId: number
): Promise<PaginatedResponse<AssetVerificationWithDetails>> {
  try {
    // Check if user has permission to read verifications
    const hasPermission = await this.checkUserAccess(userId, 'verification', 'read');
    if (!hasPermission) {
      throw new UnauthorizedError('Insufficient permissions to view verifications');
    }

    const { page = 1, limit = 20, ...filters } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AssetVerificationWhereInput = {
      ...(filters.campaignId && { campaignId: filters.campaignId }),
      ...(filters.assetId && { assetId: filters.assetId }),
      ...(filters.verifierId && { verifierId: filters.verifierId }),
      ...(filters.status && { status: { in: filters.status } }),
      ...(filters.condition && { physicalCondition: filters.condition }),
      ...(filters.dateFrom && {
        verificationDate: { gte: new Date(filters.dateFrom) },
      }),
      ...(filters.dateTo && {
        verificationDate: { lte: new Date(filters.dateTo) },
      }),
      ...(filters.search && {
        OR: [
          { asset: { name: { contains: filters.search, mode: 'insensitive' } } },
          { notes: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Apply user access restrictions
    const userAccessWhere = await this.buildUserAccessFilter(userId, 'verification');
    
    // **NEW: Check if user has no access to any campaigns**
    if (userAccessWhere.campaignId && 
        Array.isArray(userAccessWhere.campaignId.in) && 
        userAccessWhere.campaignId.in.length === 0) {
      // User has no campaign assignments, return empty result immediately
      return this.createPaginatedResponse([], 0, page, limit);
    }
    
    const finalWhere = { ...where, ...userAccessWhere };

    const [verifications, total] = await Promise.all([
      this.db.assetVerification.findMany({
        where: finalWhere,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              category: true,
              state: true,
              lga: true,
            },
          },
          verifier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          discrepancies: {
            select: {
              id: true,
              discrepancyType: true,
              severity: true,
              status: true,
            },
          },
        },
        orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder),
        skip,
        take: limit,
      }),
      this.db.assetVerification.count({ where: finalWhere }),
    ]);

    return this.createPaginatedResponse(verifications, total, page, limit);
  } catch (error) {
    this.handleError(error, 'VerificationService.getVerifications');
  }
}
```

### Option 2: Fix buildUserAccessFilter to Return Impossible Condition

Modify `buildUserAccessFilter` in `base-service.ts`:

```typescript
protected async buildUserAccessFilter(userId: number, resource: 'verification' | 'discrepancy'): Promise<any> {
  try {
    const assignments = await this.db.verificationAssignment.findMany({
      where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      select: { campaignId: true },
    });

    const campaignIds = assignments.map(a => a.campaignId);

    if (campaignIds.length === 0) {
      // Return a condition that will never match instead of empty array
      return resource === 'verification'
        ? { id: -1 } // No verification will have id = -1
        : { verification: { id: -1 } };
    }

    return resource === 'verification'
      ? { campaignId: { in: campaignIds } }
      : { verification: { campaignId: { in: campaignIds } } };
  } catch {
    return {};
  }
}
```

## Testing Steps

After applying the fix:

1. **Clear browser cache** and reload the page
2. **Check browser console** for any errors
3. **Check browser Network tab** - the API request should now complete (status 200)
4. **Verify the page** either shows:
   - Empty state message (if user has no assignments)
   - List of verifications (if user has assignments)

## Additional Debugging

If the issue persists, add temporary logging to identify exactly where it hangs:

### In `verification-service.ts` - `getVerifications` method:

Add console.log statements at key points:

```typescript
async getVerifications(params: VerificationQueryParams, userId: number): Promise<PaginatedResponse<AssetVerificationWithDetails>> {
  try {
    console.log('[DEBUG] getVerifications START - userId:', userId);
    
    const hasPermission = await this.checkUserAccess(userId, 'verification', 'read');
    console.log('[DEBUG] Permission check passed:', hasPermission);
    
    if (!hasPermission) {
      throw new UnauthorizedError('Insufficient permissions to view verifications');
    }

    const { page = 1, limit = 20, ...filters } = params;
    const skip = (page - 1) * limit;
    console.log('[DEBUG] Pagination params:', { page, limit, skip });

    const where: Prisma.AssetVerificationWhereInput = { /* ... */ };
    console.log('[DEBUG] Base where clause built');

    const userAccessWhere = await this.buildUserAccessFilter(userId, 'verification');
    console.log('[DEBUG] User access filter:', JSON.stringify(userAccessWhere));
    
    const finalWhere = { ...where, ...userAccessWhere };
    console.log('[DEBUG] Final where clause:', JSON.stringify(finalWhere));

    console.log('[DEBUG] Starting database queries...');
    const [verifications, total] = await Promise.all([/* ... */]);
    console.log('[DEBUG] Queries complete - found', total, 'total verifications');

    return this.createPaginatedResponse(verifications, total, page, limit);
  } catch (error) {
    console.error('[DEBUG] Error in getVerifications:', error);
    this.handleError(error, 'VerificationService.getVerifications');
  }
}
```

### In `base-service.ts` - `buildUserAccessFilter` method:

```typescript
protected async buildUserAccessFilter(userId: number, resource: 'verification' | 'discrepancy'): Promise<any> {
  try {
    console.log('[DEBUG] buildUserAccessFilter START - userId:', userId, 'resource:', resource);
    
    const assignments = await this.db.verificationAssignment.findMany({
      where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      select: { campaignId: true },
    });
    console.log('[DEBUG] Found', assignments.length, 'assignments');

    const campaignIds = assignments.map(a => a.campaignId);
    console.log('[DEBUG] Campaign IDs:', campaignIds);

    if (campaignIds.length === 0) {
      console.log('[DEBUG] No campaigns - returning empty filter');
      return resource === 'verification'
        ? { campaignId: { in: [] } }
        : { verification: { campaignId: { in: [] } } };
    }

    console.log('[DEBUG] Returning filter with campaign IDs');
    return resource === 'verification'
      ? { campaignId: { in: campaignIds } }
      : { verification: { campaignId: { in: campaignIds } } };
  } catch (error) {
    console.error('[DEBUG] Error in buildUserAccessFilter:', error);
    return {};
  }
}
```

## Expected Console Output

When you reload the page, you should see console logs in the terminal where Next.js is running. The logs will show you exactly where the execution stops.

### If it hangs at "buildUserAccessFilter START":
- The database query for assignments is hanging
- Check database connection and performance

### If it hangs at "Starting database queries":
- The main Prisma query is hanging
- This confirms the empty `in` clause issue
- Apply Option 1 or Option 2 fix above

### If it hangs at "Permission check":
- The `checkUserAccess` method is hanging
- Check the permissions table query

## Next Steps

1. Apply **Option 1** fix (recommended) to `verification-service.ts`
2. Test the Verifications page
3. If still hanging, add the debug logging
4. Share the console output to identify the exact hang point
