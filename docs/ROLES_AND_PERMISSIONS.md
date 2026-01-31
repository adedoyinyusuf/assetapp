# Roles and Permissions Reference

This document outlines the user roles available in the Asset Management System, divided by module. Each role grants specific permissions and access levels.

## 1. Asset Management Module
These roles are primarily for the day-to-day tracking, lifecycle management, and reporting of fixed assets.

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Viewer** | Read-only access to asset data. | • View Asset Details<br>• View Dashboard<br>• View Basic Reports |
| **Operator** | Operational staff who handle asset updates. | • **Create/Edit Assets**<br>• Initiate Asset Movements<br>• View Reports |
| **Manager** | Oversees asset operations and approves actions. | • **Approve Asset Movements**<br>• **Delete Assets**<br>• View All Reports & Analytics<br>• View Users |
| **Auditor** | Focuses on compliance and data integrity. | • **Audit Assets** (verify existence)<br>• Export Reports<br>• View Audit Logs<br>• Read-only access to other data |

---

## 2. Stock Verification Module
These roles are specialized for the physical inventory verification process (Stocktaking).

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Team Leader** | Leads a verification team. | • **Manage Verification Exercises**<br>• Approve collected data<br>• View Reporting & Analytics |
| **Senior Verifier** | Experienced verifier. | • Conduct Verification<br>• Create/Update "Found" Assets<br>• Validation of Assistant inputs |
| **Verifier** | Standard field verifier. | • Conduct Verification<br>• Scan/Input Asset Data |
| **Assistant Verifier** | Support role for field work. | • Conduct Verification (typically supervised) |
| **Quality Controller** | Ensures accuracy of verification data. | • **Review Verification Entries**<br>• Flag discrepancies<br>• View Detailed Reports |
| **Observer** | Third-party or passive participant. | • **Read-only** access to verification progress<br>• Cannot modify data |

---

## 3. Mobile Device Management (MDM) Module
These roles manage the fleet of mobile devices (tablets/phones) and staff assignments.

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **MDM Admin** | Full control over the MDM module. | • **Manage Devices** (Enroll, Lock, Wipe)<br>• **Manage Staff Assignments**<br>• View System-wide MDM Stats |
| **MDM Officer** | Daily management of devices. | • **Assign/Return Devices**<br>• Update Device Status<br>• View Staff Lists |
| **MDM Auditor** | Read-only access for auditing MDM inventory. | • View Device Inventory<br>• View Assignment History<br>• **Cannot** modify or command devices |

---

## 4. System-Level Roles
These roles span across the entire application.

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Admin** | System Administrator. | • **Manage Users & Roles**<br>• Configure System Settings<br>• Full access to all modules (typically) |
| **Super Admin** | System Owner / Root. | • **Unlimited Access**<br>• Access to database maintenance tools<br>• Cannot be restricted |
