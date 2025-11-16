# Stock Verification Module - API Documentation

## Overview

The Stock Verification Module provides comprehensive asset verification capabilities with campaign management, team assignments, discrepancy tracking, and reporting features.

## Base URL

All API endpoints are prefixed with: `/api/stock-verification`

## Authentication

All endpoints require authentication via session cookies. Include the session cookie in your requests.

**Headers Required:**
- `Cookie: session-token=<your-session-token>`

## Response Format

All responses follow this standard format:

```json
{
  "success": true|false,
  "data": <response-data>,
  "message": "Optional success message",
  "error": "Error message if success is false",
  "details": "Additional error details for validation failures"
}
```

## Pagination

Paginated endpoints return data in this format:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Campaign Management

### List Campaigns

**GET** `/api/stock-verification/campaigns`

Get a paginated list of verification campaigns.

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20)
- `status` (string, optional): Filter by status (DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED)
- `search` (string, optional): Search in campaign names and descriptions
- `sortBy` (string, optional): Sort field (name, createdAt, startDate, endDate)
- `sortOrder` (string, optional): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Q4 Asset Verification",
      "description": "Quarterly verification campaign",
      "status": "ACTIVE",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-03-31T23:59:59Z",
      "targetAssetCount": 1000,
      "completedAssetCount": 250,
      "assignmentCount": 5,
      "discrepancyCount": 12,
      "completionRate": 25.0,
      "createdAt": "2023-12-01T10:00:00Z"
    }
  ]
}
```

### Create Campaign

**POST** `/api/stock-verification/campaigns`

Create a new verification campaign.

**Request Body:**
```json
{
  "name": "Q1 Asset Verification",
  "description": "First quarter asset verification campaign",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "stateIds": [1, 2, 3],
  "lgaIds": [10, 11, 12],
  "categoryIds": [5, 6],
  "priority": "HIGH",
  "instructions": "Verify all assets in specified locations",
  "metadata": {
    "budget": 50000,
    "contact": "manager@company.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Q1 Asset Verification",
    // ... full campaign object
  },
  "message": "Campaign created successfully"
}
```

### Get Campaign Details

**GET** `/api/stock-verification/campaigns/{id}`

Get detailed information about a specific campaign.

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Q4 Asset Verification",
    // ... full campaign details
    "assignments": [...],
    "recentVerifications": [...],
    "stats": {
      "totalAssets": 1000,
      "completedVerifications": 250,
      "pendingVerifications": 750,
      "completionRate": 25.0
    }
  }
}
```

### Update Campaign

**PUT** `/api/stock-verification/campaigns/{id}`

Update an existing campaign.

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Request Body:** (same as create, all fields optional)

### Campaign Actions

**POST** `/api/stock-verification/campaigns/{id}/actions`

Perform actions on a campaign (start, complete, pause, resume).

**Request Body:**
```json
{
  "action": "start|complete|pause|resume"
}
```

---

## Team Assignment Management

### List Campaign Assignments

**GET** `/api/stock-verification/campaigns/{campaignId}/assignments`

Get all team assignments for a campaign.

### Create Assignment

**POST** `/api/stock-verification/campaigns/{campaignId}/assignments`

Assign a user to a campaign.

**Request Body:**
```json
{
  "userId": 123,
  "role": "FIELD_VERIFIER",
  "stateIds": [1, 2],
  "lgaIds": [10, 11],
  "categoryIds": [5],
  "dailyTarget": 20,
  "totalTarget": 500,
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "instructions": "Focus on critical assets first",
  "mobileAccess": true,
  "offlineAccess": false
}
```

### Update Assignment

**PUT** `/api/stock-verification/assignments/{id}`

Update an assignment.

### Delete Assignment

**DELETE** `/api/stock-verification/assignments/{id}`

Remove an assignment.

### Get User Assignments

**GET** `/api/stock-verification/users/{userId}/assignments`

Get all assignments for a specific user.

### Team Performance

**GET** `/api/stock-verification/campaigns/{campaignId}/team-performance`

Get team performance metrics for a campaign.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": 123,
      "userName": "John Smith",
      "role": "FIELD_VERIFIER",
      "totalAssigned": 500,
      "completedVerifications": 125,
      "pendingVerifications": 375,
      "discrepancyCount": 8,
      "averageVerificationTime": 15,
      "qualityScore": 92,
      "efficiency": 85,
      "dailyTarget": 20,
      "totalTarget": 500
    }
  ]
}
```

---

## Asset Verification

### List Verifications

**GET** `/api/stock-verification/verifications`

Get paginated list of asset verifications.

**Query Parameters:**
- `page`, `limit`: Pagination
- `campaignId`: Filter by campaign
- `assetId`: Filter by asset
- `verifierId`: Filter by verifier
- `status`: Filter by verification status
- `condition`: Filter by physical condition
- `dateFrom`, `dateTo`: Date range filter
- `search`: Search in asset tags, names, notes

### Create Verifications

**POST** `/api/stock-verification/verifications`

Create new asset verifications (bulk supported).

**Request Body:**
```json
{
  "campaignId": 1,
  "assetIds": [100, 101, 102],
  "scheduledDate": "2024-01-15",
  "notes": "Initial verification batch",
  "metadata": {
    "batch": "BATCH_001"
  }
}
```

### Get Verification Details

**GET** `/api/stock-verification/verifications/{id}`

Get detailed verification information.

### Update Verification

**PUT** `/api/stock-verification/verifications/{id}`

Update verification details and status.

**Request Body:**
```json
{
  "status": "VERIFIED",
  "physicalCondition": "GOOD",
  "functionalStatus": "WORKING",
  "location": "Building A, Floor 2, Room 201",
  "coordinates": {
    "lat": 9.0765,
    "lng": 7.3986
  },
  "notes": "Asset verified successfully",
  "verificationDuration": 900
}
```

### Upload Verification Photos

**POST** `/api/stock-verification/verifications/{id}/photos`

Upload photos for a verification.

**Content-Type:** `multipart/form-data` or `application/json`

**FormData Example:**
```
files: [File, File, File]
photoType_filename1: "BEFORE"
photoType_filename2: "AFTER"
```

**JSON Example:**
```json
{
  "files": [
    {
      "originalName": "asset_before.jpg",
      "mimeType": "image/jpeg",
      "data": "base64-encoded-data",
      "photoType": "BEFORE"
    }
  ]
}
```

### Get Verification Photos

**GET** `/api/stock-verification/verifications/{id}/photos`

Get all photos for a verification.

### QR Code Scanning

**POST** `/api/stock-verification/scan-qr`

Scan asset QR code and get verification status.

**Request Body:**
```json
{
  "qrData": "ASSET:12345",
  "campaignId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "asset": {
      "id": 12345,
      "assetTag": "LAPTOP-001",
      "assetName": "Dell Laptop",
      "category": "IT Equipment",
      "location": "Office Building A"
    },
    "verification": null,
    "isAlreadyVerified": false,
    "canVerify": true
  }
}
```

### Verification Statistics

**GET** `/api/stock-verification/campaigns/{campaignId}/verification-stats`

Get verification statistics for a campaign.

---

## Discrepancy Management

### List Discrepancies

**GET** `/api/stock-verification/discrepancies`

Get paginated list of discrepancies.

**Query Parameters:**
- `campaignId`: Filter by campaign
- `verificationId`: Filter by verification
- `type`: Filter by discrepancy type
- `severity`: Filter by severity
- `status`: Filter by status
- `reporterId`, `assigneeId`: Filter by users
- `dateFrom`, `dateTo`: Date range
- `search`: Search in titles, descriptions

### Create Discrepancy

**POST** `/api/stock-verification/discrepancies`

Report a new discrepancy.

**Request Body:**
```json
{
  "verificationId": 456,
  "type": "MISSING_ASSET",
  "severity": "CRITICAL",
  "title": "Asset not found at recorded location",
  "description": "Asset LAPTOP-001 not found at Building A, Room 201",
  "expectedValue": "Building A, Room 201",
  "actualValue": "Not found",
  "location": "Building A, Room 201",
  "photoEvidence": ["photo1.jpg", "photo2.jpg"],
  "metadata": {
    "lastSeenDate": "2023-12-01"
  }
}
```

### Get Discrepancy Details

**GET** `/api/stock-verification/discrepancies/{id}`

Get detailed discrepancy information.

### Update Discrepancy

**PUT** `/api/stock-verification/discrepancies/{id}`

Update discrepancy details.

### Discrepancy Actions

**POST** `/api/stock-verification/discrepancies/{id}/actions`

Perform actions on discrepancies.

**Assign:**
```json
{
  "action": "assign",
  "assigneeId": 789,
  "notes": "Please investigate and resolve"
}
```

**Resolve:**
```json
{
  "action": "resolve",
  "resolutionNotes": "Asset found in storage room"
}
```

**Close:**
```json
{
  "action": "close",
  "closureNotes": "Issue confirmed resolved"
}
```

### Discrepancy Statistics

**GET** `/api/stock-verification/campaigns/{campaignId}/discrepancy-stats`

Get discrepancy statistics for a campaign.

### Discrepancy Reports

**GET** `/api/stock-verification/campaigns/{campaignId}/discrepancy-report`

Generate discrepancy reports.

**Query Parameters:**
- `format`: Output format (json, csv, excel)
- `dateFrom`, `dateTo`: Date range
- `severity`, `status`, `type`: Filters (comma-separated)
- `assigneeId`: Filter by assignee

---

## Error Responses

### Common Error Codes

**400 Bad Request**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Insufficient permissions to perform this action"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Campaign not found"
}
```

**409 Conflict**
```json
{
  "success": false,
  "error": "Asset already verified in this campaign"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "An unexpected error occurred"
}
```

---

## Rate Limits

- **General endpoints**: 100 requests per minute per user
- **Photo upload**: 10 uploads per minute per user
- **Report generation**: 5 requests per minute per user

## Data Validation Rules

### Campaign Names
- Required, 1-100 characters
- Must be unique within organization

### Asset Tags
- Required for verification creation
- Must exist in the system

### File Uploads
- Max file size: 10MB per file
- Max files per upload: 10
- Supported formats: JPG, PNG, WEBP
- Min dimensions: 100x100px
- Max dimensions: 4000x4000px

### Date Formats
- ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`
- Timezone: UTC recommended

## Best Practices

1. **Pagination**: Always use pagination for large datasets
2. **Error Handling**: Check the `success` field before processing `data`
3. **File Uploads**: Use multipart/form-data for better performance
4. **Bulk Operations**: Use bulk endpoints when processing multiple items
5. **Caching**: Cache reference data (states, categories) on the client
6. **Rate Limiting**: Implement exponential backoff for rate limit errors

## SDK Examples

### JavaScript/TypeScript
```javascript
// Create a campaign
const response = await fetch('/api/stock-verification/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Q1 Verification',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    stateIds: [1, 2, 3]
  })
});

const result = await response.json();
if (result.success) {
  console.log('Campaign created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Python
```python
import requests

# List verifications
response = requests.get('/api/stock-verification/verifications', params={
    'campaignId': 1,
    'status': 'PENDING',
    'page': 1,
    'limit': 50
})

if response.json()['success']:
    verifications = response.json()['data']
    print(f"Found {len(verifications)} verifications")
```

---

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial release
- Campaign management
- Asset verification
- Discrepancy tracking
- Team assignments
- Reporting features