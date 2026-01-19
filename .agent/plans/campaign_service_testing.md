
# Implementation Plan - Stock Verification Campaign Service Testing

This implementation plan covers the work done to establish comprehensive unit testing for the `CampaignService` in the Stock Verification module.

## User Review Required

> [!IMPORTANT]
> The `replace_file_content` tool was used to modify `campaign-service.ts` to change the Prisma model reference from `'lga'` to `'lGA'`. Please verify this matches your Prisma Client generation.

## Proposed Changes

### Tests

#### [Campaign Service Tests](c:/Apps/assetapp/__tests__/stock-verification/services/campaign-service.test.ts)

- **Fixed Mock Initialization**: Resolved `ReferenceError` by properly using `require` inside `jest.mock`.
- **Mock Structure Update**: Updated `prismaMock.user.findUnique` return value to match the structure expected by `checkUserAccess` (nested `role.permissions`).
- **Added Permission Tests**: Added negative test cases for every service method to verify `UnauthorizedError` is thrown when permissions are missing.
- **Fixed Test Expectations**: Adjusted `createCampaign` test to not expect `status` in arguments as it relies on DB defaults.
- **Lint Fixes**: Resolved TS errors regarding missing arguments in `getCampaigns` test calls.

### Code

#### [Campaign Service](c:/Apps/assetapp/lib/stock-verification/campaign-service.ts)

- **Bug Fix**: Changed `validateEntitiesExist` call for LGAs to use the correct model name `'lGA'` instead of `'lga'`, resolving a runtime error found during testing.

#### [Validation Schemas](c:/Apps/assetapp/lib/stock-verification/validation.ts)

- **Update Schema**: Made fields in `updateCampaignSchema` optional using `partial()` to correctly support partial updates.

## Verification Plan

### Automated Tests
Run the campaign service tests to verify all 22 tests pass:
```bash
npm test __tests__/stock-verification/services/campaign-service.test.ts
```

### Manual Verification
No manual verification needed as these are backend service unit tests.
