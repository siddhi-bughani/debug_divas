# SAHAY — MongoDB Schema Specification & Data Contracts

This document formalizes the MongoDB document schemas, relationships, indexes, and REST API payload contracts for the planned Node.js and Express.js backend.

---

## 1. Entity-Relationship Overview

```
[Users]
   │
   ├────── (created/reviewed) ────────► [Reports]
   │                                        │
   ├────── (authorized) ───────────────► [ResourceRequests] ◄──── (linked) ── [ShortageAlerts]
   │                                        │                                      │
   ├────── (assigned/managed) ─────────► [ResourceAllocations]                     │
   │                                        │                                      │
   ├────── (monitored/stocked) ────────► [InventoryRecords] ───────────────────────┘
   │
   ├────── (coordinated) ─────────────► [Volunteers] ──► [VolunteerAssignments]
   │
   ├────── (registered) ──────────────► [Donations]
   │
   └────── (responded) ───────────────► [Incidents]
```

---

## 2. Document Collections & Field Definitions

### 2.1 Collection: `users`
Represents administrators, camp managers, logistics officers, and field reporters.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `userId` | `String` | Yes | Unique human-readable identifier (e.g. `USR-ADMIN-01`) |
| `name` | `String` | Yes | Full name |
| `email` | `String` | Yes | Unique index, lowercase email address |
| `passwordHash` | `String` | Yes | Salted bcrypt hash |
| `role` | `String` | Yes | `Central Administrator`, `Camp Manager`, `Reporter`, `Logistics Officer` |
| `badge` | `String` | No | Operational unit badge (e.g. `State HQ`, `CAMP-01`) |
| `assignedCampId` | `String` | No | Referenced `campId` if role is `Camp Manager` |
| `phone` | `String` | No | E.164 phone format |
| `permissions` | `[String]` | Yes | Array of capability strings (`all`, `camp:write`, `request:approve`, etc.) |
| `createdAt` | `Date` | Yes | ISO timestamp |
| `updatedAt` | `Date` | Yes | ISO timestamp |

---

### 2.2 Collection: `camps`
Master registry for authorized relief shelters and transit halls.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `campId` | `String` | Yes | Unique identifier (e.g. `CAMP-01`), unique index |
| `name` | `String` | Yes | Official facility name |
| `address` | `String` | Yes | Street address and local landmark |
| `district` | `String` | Yes | Administrative district (e.g. `Ernakulam`) |
| `state` | `String` | Yes | Administrative state (e.g. `Kerala`) |
| `location` | `Object` | Yes | GeoJSON Point: `{ type: "Point", coordinates: [longitude, latitude] }` |
| `manager` | `String` | Yes | Name of designated officer in charge |
| `contactPhone` | `String` | Yes | Emergency manager telephone number |
| `capacity` | `Number` | Yes | Maximum safe occupant capacity |
| `currentOccupancy` | `Number` | Yes | Current verified headcount |
| `operationalStatus`| `String` | Yes | `Active`, `Standby`, `Decommissioned` |
| `primaryVulnerability` | `String` | No | Specific focus (e.g. `Riverfront flood surge`, `Elderly care`) |
| `establishedDate` | `Date` | Yes | Date shelter opened |
| `createdAt` | `Date` | Yes | ISO timestamp |
| `updatedAt` | `Date` | Yes | ISO timestamp |

---

### 2.3 Collection: `reports`
Ground-level needs reports submitted by citizens, volunteer workers, or local representatives.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `reportId` | `String` | Yes | Unique internal key (`REP-101`) |
| `referenceNumber` | `String` | Yes | Unique tracking reference (e.g. `SHY-REP-2026-081`) |
| `category` | `String` | Yes | `Drinking Water`, `Food`, `Sanitary Pads`, `Medicines`, `Medical Assistance`, `Blankets`, `Hygiene Supplies`, `Shelter`, `Other` |
| `description` | `String` | Yes | Detailed narrative of the shortage |
| `estimatedQuantity` | `Number` | No | Estimated shortfall units |
| `unit` | `String` | Yes | `Packs`, `Litres`, `Kits`, `Units`, `Tins` |
| `peopleAffected` | `Number` | Yes | Estimated headcount |
| `urgency` | `String` | Yes | `Critical`, `High`, `Medium`, `Low` |
| `campId` | `String` | No | Associated `camps.campId` if known |
| `campName` | `String` | No | Facility title or neighborhood description |
| `manualLocationAddress` | `String` | Yes | Verified ground address |
| `district` | `String` | Yes | District name |
| `reporterName` | `String` | No | Optional name (default: `Anonymous Citizen`) |
| `reporterContact` | `String` | No | Phone number (redacted in non-authorized views) |
| `protectContact` | `Boolean` | Yes | Flag to restrict access to contact details |
| `photoUrl` | `String` | No | Cloud storage URL for verified image evidence |
| `status` | `String` | Yes | `Submitted`, `Under Review`, `Verified`, `Converted to Request`, `Converted to Incident`, `Resolved`, `Rejected` |
| `isPotentialDuplicate` | `Boolean` | Yes | Heuristic duplicate flag |
| `duplicateOfId` | `String` | No | Pointer to primary report if duplicate |
| `convertedToRequestId` | `String` | No | Linked `requests.requestId` |
| `convertedToIncidentId`| `String` | No | Linked `incidents.incidentId` |
| `reviewedBy` | `String` | No | Name of verifying officer |
| `reviewedAt` | `Date` | No | Verification timestamp |
| `reviewNotes` | `String` | No | Audit findings |
| `submittedAt` | `Date` | Yes | Submission timestamp |

---

### 2.4 Collection: `resourceRequests`
Formal priority requisitions for logistics and supply dispatch.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `requestId` | `String` | Yes | Unique request ID (`REQ-2001`) |
| `referenceCode` | `String` | Yes | E.g. `REQ-WAT-01` |
| `campId` | `String` | Yes | Recipient `camps.campId` |
| `campName` | `String` | Yes | Recipient camp name |
| `resourceCategory` | `String` | Yes | Standard resource classification |
| `resourceItem` | `String` | Yes | Specific product name |
| `requestedQuantity` | `Number` | Yes | Quantity requested |
| `availableQuantityAtRequest` | `Number` | Yes | Local camp stock at time of request |
| `unit` | `String` | Yes | Measurement unit |
| `affectedPopulation` | `Number` | Yes | Impacted headcount |
| `severity` | `String` | Yes | `Critical`, `High`, `Medium`, `Low` |
| `isMedicalEmergency` | `Boolean` | Yes | Flag for urgent clinical intervention |
| `status` | `String` | Yes | `Submitted`, `Under Review`, `Approved`, `Allocated`, `Dispatched`, `Delivered`, `Rejected` |
| `allocatedWarehouseId` | `String` | No | Source warehouse ID |
| `allocatedQuantity` | `Number` | No | Reserved/dispatched units |
| `sourceReportId` | `String` | No | Originating `reports.reportId` |
| `linkedShortageAlertId` | `String` | No | Originating or resolved `shortageAlerts.alertId` |
| `priorityScore` | `Number` | Yes | Calculated priority (0-100) |
| `submittedAt` | `Date` | Yes | Creation timestamp |
| `reviewedAt` | `Date` | No | Approval timestamp |
| `reviewedBy` | `String` | No | Verifying officer name |
| `dispatchedAt` | `Date` | No | Dispatch timestamp |
| `deliveredAt` | `Date` | No | Delivery confirmation timestamp |
| `notes` | `String` | No | Operational annotations |

---

### 2.5 Collection: `inventoryRecords`
Multi-echelon stock balances across central warehouses and relief shelters.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `inventoryRecordId` | `String` | Yes | Unique ID (e.g. `INV-WH1-01`) |
| `locationType` | `String` | Yes | `Warehouse`, `Camp` |
| `locationId` | `String` | Yes | E.g. `WH-01` or `CAMP-01` |
| `locationName` | `String` | Yes | Facility title |
| `category` | `String` | Yes | Category |
| `itemName` | `String` | Yes | Item title |
| `availableQuantity` | `Number` | Yes | Total physical available stock (>= 0) |
| `reservedQuantity` | `Number` | Yes | Allocated un-dispatched stock (>= 0) |
| `safetyStockThreshold` | `Number` | Yes | Minimum buffer threshold before alert |
| `estimatedDemand` | `Number` | Yes | Projected local demand |
| `unit` | `String` | Yes | Measurement unit |
| `lastUpdated` | `Date` | Yes | ISO timestamp |

---

### 2.6 Collection: `shortageAlerts`
Deterministic smart shortage alerts generated by the shortage detection service.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `alertId` | `String` | Yes | Unique identifier (e.g. `ALT-1001`) |
| `dedupKey` | `String` | Yes | Stable deduplication hash: `${campId}_${category}_${itemName}` |
| `inventoryRecordId` | `String` | Yes | Linked `inventoryRecords.inventoryRecordId` |
| `campId` | `String` | Yes | Affected `camps.campId` |
| `campName` | `String` | Yes | Affected camp name |
| `district` | `String` | Yes | District |
| `locationAddress` | `String` | Yes | Street address |
| `resourceCategory` | `String` | Yes | Resource category |
| `resourceItem` | `String` | Yes | Resource item name |
| `unit` | `String` | Yes | Unit |
| `availableQuantityAtDetection` | `Number` | Yes | Available stock when alert fired |
| `safetyStockThreshold` | `Number` | Yes | Configured safety threshold |
| `estimatedDemand` | `Number` | Yes | Total demand (including verified requests) |
| `estimatedShortageQuantity` | `Number` | Yes | Shortfall deficit (`safetyStock - availableQuantity`) |
| `peopleAffected` | `Number` | Yes | Camp population impacted |
| `severity` | `String` | Yes | `Critical`, `High`, `Medium`, `Low` |
| `status` | `String` | Yes | `Detected`, `Acknowledged`, `Action Assigned`, `In Progress`, `Resolved` |
| `detectedAt` | `Date` | Yes | Detection timestamp |
| `acknowledgedAt` | `Date` | No | Acknowledged timestamp |
| `resolvedAt` | `Date` | No | Resolution timestamp |
| `assignedTo` | `String` | No | Responsible officer or desk |
| `explanation` | `String` | Yes | Transparent plain-language diagnostic |
| `recommendedAction` | `String` | Yes | Actionable mitigation directive |
| `linkedRequestIds` | `[String]` | Yes | Array of related `requestId`s |
| `sourceReportIds` | `[String]` | Yes | Array of related `reportId`s |
| `internalNotes` | `String` | No | Coordination logs |
| `recurrenceCount` | `Number` | Yes | Times shortage condition re-occurred |

---

### 2.7 Collection: `donations`
Monetary contributions (INR) and in-kind humanitarian supplies.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `donationId` | `String` | Yes | Unique donation ID (`DON-4001`) |
| `receiptNumber` | `String` | Yes | Tracking receipt code (`SHY-DON-2026-001`) |
| `type` | `String` | Yes | `Monetary`, `In-Kind` |
| `donorName` | `String` | Yes | Name of individual or organization |
| `donorEmail` | `String` | No | Contact email |
| `donorPhone` | `String` | No | Contact phone |
| `amountINR` | `Number` | No | Amount in Indian Rupees (for monetary) |
| `itemsDescription`| `String` | Yes | Goods summary or grant title |
| `quantity` | `Number` | No | Physical units (for in-kind) |
| `unit` | `String` | No | Unit string |
| `intendedCampId` | `String` | No | Specific camp or `null` for central pool |
| `intendedCampName` | `String` | Yes | Target destination title |
| `status` | `String` | Yes | `Pledged`, `Received`, `Verified`, `Allocated`, `Distributed` |
| `allocationStatus`| `String` | Yes | `Under Review`, `Allocated`, `Distributed` |
| `allocatedTo` | `String` | No | Summary of destination or purchase |
| `receivedDate` | `Date` | Yes | Date registered |
| `notes` | `String` | No | Audit or bank transfer details |

---

### 2.8 Collection: `volunteers`
Volunteers registered for medical, logistics, and counseling relief.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `volunteerId` | `String` | Yes | Unique ID (`VOL-5001`) |
| `name` | `String` | Yes | Volunteer name |
| `role` | `String` | Yes | Primary role |
| `skills` | `[String]` | Yes | Array of capabilities |
| `availability` | `String` | Yes | `Full-Time (On Duty)`, `Available for Deployment`, `On Leave` |
| `assignedCampId` | `String` | No | Camp ID or `null` |
| `assignedCampName` | `String` | Yes | Camp name or `Standby Roster` |
| `currentAssignment` | `String` | Yes | Duty description |
| `assignmentStatus` | `String` | Yes | `Available`, `Deployed`, `On Leave` |
| `phone` | `String` | Yes | Phone number |
| `email` | `String` | No | Email |
| `tasksCompleted` | `Number` | Yes | Counter of completed tasks |
| `deployedSince` | `Date` | No | Active deployment timestamp |

---

### 2.9 Collection: `incidents`
Emergency medical events, water contamination, generator failures, and physical hazards.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `incidentId` | `String` | Yes | Unique key (`INC-301`) |
| `title` | `String` | Yes | Incident summary |
| `category` | `String` | Yes | `Medical Emergency`, `Severe Shortage & Health Hazard`, `Infrastructure Damage`, `Overcrowding & Shelter Risk`, `Sanitation & Water Contamination` |
| `campId` | `String` | No | Affected camp ID |
| `campName` | `String` | Yes | Affected camp name |
| `locationAddress` | `String` | Yes | Precise location |
| `district` | `String` | Yes | District name |
| `severity` | `String` | Yes | `Critical`, `High`, `Medium` |
| `status` | `String` | Yes | `Reported`, `Verified`, `Response Assigned`, `In Progress`, `Resolved` |
| `reportedAt` | `Date` | Yes | ISO timestamp |
| `assignedResponder` | `String` | Yes | Responding physician, ambulance unit, or engineer |
| `peopleAffected` | `Number` | Yes | Headcount |
| `linkedRequestIds` | `[String]` | Yes | Related resource requests |
| `linkedAlertIds` | `[String]` | Yes | Related shortage alerts |
| `notes` | `String` | No | Clinical / damage notes |

---

### 2.10 Collection: `activityLogs`
Tamper-resistant audit trail of administrative actions.

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary Document ID |
| `logId` | `String` | Yes | Unique ID |
| `timestamp` | `Date` | Yes | ISO timestamp |
| `user` | `String` | Yes | Performing user / officer name |
| `action` | `String` | Yes | Action verb (`Approved Request`, `Verified Report`, `Committed Allocation`) |
| `target` | `String` | Yes | Target entity identifier and summary |
| `category` | `String` | Yes | `Report`, `Request`, `Inventory`, `Alert`, `Allocation`, `Donation`, `Volunteer`, `Emergency` |

---

## 3. Recommended MongoDB Indexes

```javascript
// camps collection
db.camps.createIndex({ campId: 1 }, { unique: true });
db.camps.createIndex({ location: "2dsphere" });
db.camps.createIndex({ district: 1, operationalStatus: 1 });

// shortageAlerts collection
db.shortageAlerts.createIndex({ alertId: 1 }, { unique: true });
db.shortageAlerts.createIndex({ dedupKey: 1, status: 1 });
db.shortageAlerts.createIndex({ severity: 1, status: 1 });
db.shortageAlerts.createIndex({ campId: 1, status: 1 });

// reports collection
db.reports.createIndex({ referenceNumber: 1 }, { unique: true });
db.reports.createIndex({ category: 1, campId: 1, submittedAt: -1 });
db.reports.createIndex({ status: 1 });

// resourceRequests collection
db.resourceRequests.createIndex({ requestId: 1 }, { unique: true });
db.resourceRequests.createIndex({ campId: 1, status: 1 });
db.resourceRequests.createIndex({ severity: 1, status: 1 });

// inventoryRecords collection
db.inventoryRecords.createIndex({ locationId: 1, category: 1, itemName: 1 }, { unique: true });
db.inventoryRecords.createIndex({ locationType: 1, category: 1 });
```

---

## 4. Example Express REST API Endpoints & Payloads

### POST `/api/reports`
Submits a public need report.
```json
{
  "category": "Sanitary Pads",
  "description": "Shortage of menstrual hygiene supplies in Women's Hall 2.",
  "estimatedQuantity": 100,
  "unit": "Packs",
  "peopleAffected": 80,
  "urgency": "High",
  "campId": "CAMP-01",
  "manualLocationAddress": "Block B, Govt HSS Aluva",
  "district": "Ernakulam",
  "reporterName": "Field Volunteer Anita",
  "reporterContact": "+91 94471 00000",
  "protectContact": true
}
```

### POST `/api/allocations/authorize`
Explicitly commits an explainable allocation recommendation from warehouse to camp.
```json
{
  "requestId": "REQ-2004",
  "sourceWarehouseId": "WH-01",
  "allocatedQuantity": 120,
  "reviewerName": "Central Administrator",
  "notes": "Verified ample buffer in WH-01; meeting 100% of camp sanitary pad demand."
}
```

### POST `/api/alerts/resolve`
Verifies and marks an alert resolved (only permitted if stock meets safety threshold).
```json
{
  "alertId": "ALT-1004",
  "verifiedStockAvailable": 135,
  "safetyStockThreshold": 120,
  "resolvedBy": "Central Administrator",
  "notes": "Verified receipt of 120 packs from WH-01. Stock level now healthy."
}
```
