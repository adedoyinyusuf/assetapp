# Stock Verification Module - User Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Campaign Management](#campaign-management)
4. [Team Management](#team-management)
5. [Asset Verification Process](#asset-verification-process)
6. [Discrepancy Management](#discrepancy-management)
7. [Reporting and Analytics](#reporting-and-analytics)
8. [Mobile App Usage](#mobile-app-usage)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

The Stock Verification Module is a comprehensive system for managing asset verification campaigns. It enables organizations to:

- **Plan and manage verification campaigns** across multiple locations
- **Assign team members** with specific roles and responsibilities
- **Track verification progress** in real-time
- **Identify and resolve discrepancies** efficiently
- **Generate comprehensive reports** for stakeholders

### Key Features

- ✅ **Campaign Management**: Create, schedule, and monitor verification campaigns
- ✅ **Role-Based Access**: Different permissions for managers, supervisors, and field staff
- ✅ **Mobile Support**: QR code scanning and photo capture on mobile devices
- ✅ **Real-Time Tracking**: Live progress monitoring and team performance metrics
- ✅ **Discrepancy Resolution**: Structured workflow for issue identification and resolution
- ✅ **Comprehensive Reporting**: Executive dashboards and detailed analytics

---

## Getting Started

### Prerequisites

Before using the Stock Verification Module, ensure you have:

1. **User Account**: Valid user account with appropriate permissions
2. **Device Access**: Computer or mobile device with camera (for QR scanning)
3. **Network Connection**: Internet access for real-time synchronization

### First Login

1. **Access the System**: Navigate to the asset management portal
2. **Login**: Use your credentials to access the system
3. **Module Access**: Click on "Stock Verification" in the main menu
4. **Dashboard**: Review your assigned campaigns and tasks

### User Roles and Permissions

| Role | Permissions | Description |
|------|-------------|-------------|
| **Campaign Manager** | Full access to campaigns, teams, and reports | Create campaigns, assign teams, generate reports |
| **Supervisor** | Manage team assignments, review verifications | Assign tasks, review work, resolve discrepancies |
| **Lead Verifier** | Verify assets, manage discrepancies | Field verification, quality control |
| **Field Verifier** | Basic verification tasks | Scan QR codes, update asset status, report issues |
| **Reviewer** | Review and approve verifications | Quality assurance, final approval |

---

## Campaign Management

### Creating a New Campaign

1. **Navigate to Campaigns**
   - Click "Campaigns" in the main menu
   - Select "Create New Campaign"

2. **Basic Information**
   - **Campaign Name**: Enter a descriptive name (e.g., "Q1 2024 IT Equipment Verification")
   - **Description**: Add detailed description of campaign objectives
   - **Priority**: Set campaign priority (LOW, MEDIUM, HIGH, CRITICAL)

3. **Timeline**
   - **Start Date**: When the campaign should begin
   - **End Date**: Target completion date
   - **Buffer Days**: Additional days for completion (optional)

4. **Scope Definition**
   - **Geographic Scope**: Select states and LGAs to include
   - **Asset Categories**: Choose which asset types to verify
   - **Filter Criteria**: Add specific filters if needed

5. **Campaign Settings**
   - **Instructions**: Detailed instructions for team members
   - **Metadata**: Additional campaign information (budget, contacts, etc.)

6. **Review and Create**
   - Review all settings
   - Click "Create Campaign"
   - Campaign status will be "DRAFT" initially

### Managing Campaigns

#### Campaign Status Lifecycle

```
DRAFT → ACTIVE → PAUSED/COMPLETED → COMPLETED
         ↓
      CANCELLED
```

- **DRAFT**: Campaign created but not started
- **ACTIVE**: Campaign is running, team members can perform verifications
- **PAUSED**: Temporarily suspended, can be resumed
- **COMPLETED**: All verifications finished
- **CANCELLED**: Campaign terminated

#### Campaign Actions

**Starting a Campaign**
1. Ensure all team assignments are complete
2. Click "Start Campaign" button
3. Status changes to "ACTIVE"
4. Team members receive notifications

**Pausing a Campaign**
1. Click "Actions" → "Pause Campaign"
2. Add reason for pausing
3. Team members notified of suspension

**Completing a Campaign**
1. Ensure all verifications are finished
2. Review campaign summary
3. Click "Complete Campaign"
4. Generate final reports

---

## Team Management

### Assigning Team Members

1. **Access Campaign Details**
   - Open the campaign
   - Click "Team" tab

2. **Add Team Member**
   - Click "Add Assignment"
   - Select user from dropdown
   - Choose role (Field Verifier, Lead Verifier, etc.)

3. **Define Assignment Scope**
   - **Geographic Areas**: Assign specific states/LGAs
   - **Asset Categories**: Specify which asset types
   - **Target Numbers**: Set daily and total targets

4. **Assignment Settings**
   - **Start/End Dates**: Assignment duration
   - **Instructions**: Specific instructions for this team member
   - **Access Levels**: Mobile access, offline capabilities

5. **Performance Targets**
   - **Daily Target**: Expected verifications per day
   - **Total Target**: Total verifications for the assignment
   - **Quality Standards**: Expected accuracy levels

### Team Performance Monitoring

#### Performance Metrics

- **Efficiency**: Percentage of target completions
- **Quality Score**: Accuracy of verifications (based on discrepancy rates)
- **Average Time**: Time spent per verification
- **Completion Rate**: Percentage of assigned assets completed

#### Performance Dashboard

Access team performance via:
1. Campaign Details → "Team Performance" tab
2. View individual and team statistics
3. Identify top performers and areas for improvement
4. Export performance reports

### Managing Assignments

#### Updating Assignments
- Modify targets, dates, or scope as needed
- Changes take effect immediately
- Team members receive notifications

#### Removing Assignments
- Only possible if no active verifications
- Use "Remove Assignment" with confirmation
- Alternative: Mark as "COMPLETED" to preserve history

---

## Asset Verification Process

### Traditional Verification Workflow

1. **Access Assigned Assets**
   - Login to verification system
   - View assigned asset list
   - Filter by location or category

2. **Locate Physical Asset**
   - Use asset tag or location information
   - Navigate to asset location
   - Physically locate the asset

3. **Verify Asset Details**
   - Confirm asset tag matches system
   - Check asset condition
   - Verify location accuracy

4. **Update System**
   - Update asset status
   - Add verification notes
   - Upload photos if required
   - Submit verification

### QR Code Scanning Workflow

1. **Open Mobile App/Scanner**
   - Access QR scanner feature
   - Ensure camera permissions enabled

2. **Scan Asset QR Code**
   - Point camera at QR code
   - Wait for successful scan
   - System displays asset information

3. **Verify Asset Information**
   - Review displayed asset details
   - Confirm physical asset matches
   - Check for any discrepancies

4. **Complete Verification**
   - Update asset condition
   - Add notes if needed
   - Take photos (before/after)
   - Submit verification

### Photo Documentation

#### Photo Requirements
- **Minimum Resolution**: 800x600 pixels
- **File Formats**: JPG, PNG, WEBP
- **Maximum Size**: 10MB per photo
- **Maximum Count**: 10 photos per verification

#### Photo Types
- **BEFORE**: Asset condition before verification
- **AFTER**: Asset condition after any maintenance
- **DAMAGE**: Document any damage found
- **LOCATION**: Show asset in its environment
- **GENERAL**: Any other relevant photos

#### Best Practices
- Use good lighting
- Capture clear, focused images
- Include asset tag in photos when possible
- Document any issues clearly
- Add descriptive filenames

### Verification Status Management

#### Status Options
- **PENDING**: Assigned but not started
- **IN_PROGRESS**: Currently being verified
- **VERIFIED**: Verification completed by field staff
- **APPROVED**: Verified and approved by supervisor
- **REJECTED**: Verification needs correction
- **CANCELLED**: Verification cancelled

#### Status Transitions
```
PENDING → IN_PROGRESS → VERIFIED → APPROVED
                           ↓
                       REJECTED → IN_PROGRESS
```

---

## Discrepancy Management

### Identifying Discrepancies

Discrepancies occur when:
- Asset is not found at recorded location
- Asset condition differs from records
- Asset details don't match system data
- Asset is damaged or non-functional

### Reporting Discrepancies

1. **During Verification**
   - Select "Report Discrepancy" option
   - Choose discrepancy type
   - System auto-assigns severity level

2. **Discrepancy Information**
   - **Type**: Select from predefined types
     - MISSING_ASSET
     - LOCATION_MISMATCH
     - CONDITION_MISMATCH
     - DATA_INCONSISTENCY
     - PHYSICAL_DAMAGE
     - FUNCTIONAL_ISSUE
   - **Title**: Brief description
   - **Description**: Detailed explanation
   - **Expected vs Actual**: What was expected vs what was found

3. **Evidence Collection**
   - Upload photos showing the issue
   - Add location coordinates if relevant
   - Include any relevant documentation

### Discrepancy Resolution Workflow

#### Status Lifecycle
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```

1. **OPEN**: New discrepancy reported
2. **IN_PROGRESS**: Assigned to someone for resolution
3. **RESOLVED**: Issue has been fixed
4. **CLOSED**: Resolution confirmed and approved

#### Resolution Process

**Step 1: Triage and Assignment**
- Supervisor reviews new discrepancies
- Assigns appropriate severity level
- Assigns to team member for resolution

**Step 2: Investigation**
- Assigned person investigates the issue
- Gathers additional information if needed
- Documents findings

**Step 3: Resolution**
- Takes corrective action
- Updates system records if needed
- Documents resolution steps
- Changes status to "RESOLVED"

**Step 4: Verification and Closure**
- Supervisor verifies resolution
- Confirms issue is fully addressed
- Closes the discrepancy

### Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|-----------|
| **CRITICAL** | High-value assets missing or damaged | 2 hours | Missing laptops, damaged servers |
| **HIGH** | Significant issues affecting operations | 1 day | Location mismatches, functional issues |
| **MEDIUM** | Moderate issues requiring attention | 3 days | Minor condition discrepancies |
| **LOW** | Minor issues for future resolution | 1 week | Data entry corrections |

---

## Reporting and Analytics

### Available Reports

#### Campaign Summary Report
- Overall campaign progress
- Completion statistics
- Team performance overview
- Timeline analysis

#### Verification Report
- Detailed verification results
- Asset condition analysis
- Quality metrics
- Geographic distribution

#### Discrepancy Report
- All discrepancies by campaign
- Resolution status tracking
- Trends and patterns
- Cost impact analysis

#### Team Performance Report
- Individual performance metrics
- Efficiency comparisons
- Quality scores
- Productivity trends

#### Executive Dashboard
- High-level KPIs
- Campaign comparisons
- Resource utilization
- ROI analysis

### Generating Reports

1. **Select Report Type**
   - Choose from available report templates
   - Custom reports can be requested

2. **Set Parameters**
   - Date range
   - Geographic filters
   - Team member filters
   - Asset category filters

3. **Choose Output Format**
   - **PDF**: For formal presentations
   - **Excel**: For data analysis
   - **CSV**: For system integration
   - **JSON**: For API consumption

4. **Generate and Download**
   - Click "Generate Report"
   - Wait for processing completion
   - Download or email report

### Key Metrics and KPIs

#### Campaign Metrics
- **Completion Rate**: Percentage of assets verified
- **On-Time Performance**: Campaigns completed by deadline
- **Resource Utilization**: Team efficiency metrics
- **Quality Score**: Verification accuracy rating

#### Operational Metrics
- **Average Verification Time**: Time per asset
- **Discrepancy Rate**: Issues per 100 verifications
- **Resolution Time**: Average time to fix issues
- **Cost Per Verification**: Financial efficiency

#### Quality Metrics
- **Accuracy Rate**: Correct verifications percentage
- **Rework Rate**: Verifications requiring correction
- **Photo Compliance**: Documentation completeness
- **Audit Findings**: External audit results

---

## Mobile App Usage

### Mobile App Features

- QR code scanning
- Photo capture and upload
- Offline data synchronization
- GPS location tracking
- Push notifications
- Voice notes (where available)

### Getting Started with Mobile

1. **Download App**
   - Available on iOS and Android
   - Search for "Asset Verification" in app store

2. **Login and Setup**
   - Use same credentials as web portal
   - Enable camera and location permissions
   - Configure offline sync settings

3. **Sync Assignments**
   - Pull down to refresh assignment list
   - Download offline data if needed
   - Check for updates regularly

### Offline Usage

#### Preparing for Offline Work
1. **Pre-sync Data**
   - Download assigned campaigns
   - Cache asset information
   - Ensure sufficient storage space

2. **Offline Capabilities**
   - Scan QR codes
   - Complete verifications
   - Take and store photos
   - Record voice notes

3. **Sync When Online**
   - Data automatically syncs when connection available
   - Manual sync option available
   - Conflict resolution for duplicate entries

### Mobile Best Practices

- **Battery Management**: Carry portable chargers for long fieldwork
- **Storage Space**: Regularly sync and clear local data
- **Camera Quality**: Use device's best camera settings
- **Network Usage**: Sync over Wi-Fi when possible to save data
- **Security**: Use device lock screen and app security features

---

## Troubleshooting

### Common Issues and Solutions

#### Login Problems

**Problem**: Cannot login to the system
**Solutions**:
- Verify username and password
- Check network connection
- Clear browser cache and cookies
- Contact IT support if issues persist

#### QR Code Scanning Issues

**Problem**: QR code won't scan
**Solutions**:
- Clean camera lens
- Ensure adequate lighting
- Hold device steady
- Try different angle/distance
- Manually enter asset tag if scanning fails

#### Photo Upload Problems

**Problem**: Photos won't upload
**Solutions**:
- Check file size (must be under 10MB)
- Verify file format (JPG, PNG, WEBP only)
- Ensure stable internet connection
- Try reducing photo quality/size
- Restart app if problem persists

#### Sync Issues

**Problem**: Data not syncing between devices
**Solutions**:
- Check internet connection
- Force manual sync
- Restart application
- Clear local cache
- Re-login to refresh session

#### Performance Issues

**Problem**: System running slowly
**Solutions**:
- Clear browser cache
- Close unnecessary browser tabs
- Check network speed
- Try different browser
- Report to IT if widespread issue

### Getting Help

#### Built-in Help
- Help tooltips on each page
- Context-sensitive help buttons
- Video tutorials (where available)
- FAQ section in app

#### Support Channels
1. **Help Desk**: Internal IT support
2. **User Manual**: This comprehensive guide
3. **Training Materials**: Available in learning management system
4. **Peer Support**: User community forums

#### Escalation Process
1. Try self-help resources first
2. Contact local IT support
3. Escalate to system administrators
4. Contact vendor support if needed

---

## FAQ

### General Questions

**Q: How often should we run verification campaigns?**
A: Typically quarterly for critical assets, annually for standard assets. High-value or high-risk assets may require more frequent verification.

**Q: Can I modify a campaign after it's started?**
A: Limited modifications are allowed. You can add team members, adjust dates, and update instructions. Major changes require pausing the campaign.

**Q: What happens if team members can't complete their assignments?**
A: Assignments can be redistributed among team members. The system tracks all changes and maintains audit trails.

### Technical Questions

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions). Internet Explorer is not supported.

**Q: Can multiple people verify the same asset?**
A: No, each asset can only be verified once per campaign. However, verifications can be reviewed and approved by supervisors.

**Q: How long is data stored in the system?**
A: Verification data is retained according to organizational policy (typically 7 years for compliance).

### Mobile App Questions

**Q: Does the mobile app work offline?**
A: Yes, you can complete verifications offline. Data will sync when you reconnect to the internet.

**Q: Can I use any smartphone for verification?**
A: Most modern smartphones with cameras are supported. Check system requirements in the app store.

**Q: What if I accidentally submit incorrect information?**
A: Contact your supervisor immediately. Verifications can be corrected before final approval.

### Process Questions

**Q: How do I report a missing asset?**
A: Create a discrepancy report with type "MISSING_ASSET" and provide all available details about when the asset was last seen.

**Q: What if I find an asset that's not in my assignment list?**
A: Report it as a "Found Asset" through the discrepancy system. It may belong to another campaign or need to be added to the database.

**Q: Can I verify assets outside my assigned area?**
A: Only if explicitly authorized by your supervisor. Unauthorized verifications may be rejected.

---

## Best Practices

### For Campaign Managers
- Plan campaigns during low-activity periods
- Provide clear instructions and expectations
- Monitor progress regularly and provide feedback
- Address issues promptly to avoid delays

### For Field Verifiers
- Review assignment details before starting
- Carry necessary tools (mobile device, charger, cleaning supplies)
- Document everything thoroughly
- Report issues immediately
- Follow safety protocols at all times

### For Supervisors
- Conduct regular team check-ins
- Review verifications promptly
- Provide constructive feedback
- Address training needs quickly
- Maintain quality standards consistently

### Data Quality
- Always verify asset tags match system records
- Take clear, well-lit photos
- Use consistent naming conventions
- Include context in notes and descriptions
- Double-check information before submitting

---

*This user guide is a living document. Please report any errors or suggestions for improvement to the system administrators.*

**Version**: 1.0  
**Last Updated**: January 2024  
**Next Review**: July 2024