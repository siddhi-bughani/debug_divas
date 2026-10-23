# SAHAY — Smart Humanitarian Relief & Resource Management Platform

> Centralized humanitarian relief operations platform for government disaster management authorities, camp managers, and NGOs. 
> Complete full-stack application featuring a polished React Vite frontend and a secure Node.js, Express.js, and MongoDB backend.

---

## 1. System Architecture

SAHAY is built as a production-grade full-stack disaster logistics system:

```
┌────────────────────────────────────────────────────────┐
│                   SAHAY React Frontend                 │
│  (React 18 + Vite + Tailwind CSS + Leaflet + Recharts) │
│                   http://localhost:3000                │
└───────────────────────────┬────────────────────────────┘
                            │ Axios REST API Calls (Bearer JWT)
                            ▼
┌────────────────────────────────────────────────────────┐
│                SAHAY Express.js Backend                │
│                 http://localhost:5000                  │
├────────────────────────────────────────────────────────┤
│ • JWT Authentication & Role-Based Access Control       │
│ • Deterministic Shortage Detection Engine              │
│ • Explainable Rule-Based Supply Prioritization Engine  │
│ • Report Duplicate Detection & Request Conversion      │
│ • Comprehensive Audit Logging & Metric Aggregation     │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM / In-Memory Mock
                            ▼
┌────────────────────────────────────────────────────────┐
│                 MongoDB Data Store                     │
│  (Local MongoDB Service, Atlas Cloud, or In-Memory)    │
│ • 14 Collections: Users, Camps, Warehouses, Reports,  │
│   Requests, Inventory, Allocations, Alerts, Donations, │
│   Volunteers, VolunteerAssignments, Incidents, Logs    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Quick Start: How to Run SAHAY on Your PC

### Prerequisites
- **Node.js**: v18.0.0 or later installed on your PC.
- **Git** (optional, to clone).
- **MongoDB** (optional): If local MongoDB or MongoDB Atlas is available, it connects automatically. If MongoDB is **not** installed on your PC, the backend activates a built-in zero-configuration in-memory MongoDB datastore with automatic seeding, so the application runs out of the box with zero setup!

---

### Step 1: Open Terminal in Project Directory
Open PowerShell or Command Prompt in the project folder:
```powershell
cd C:\Users\Lenovo\.gemini\antigravity\scratch\sahay-platform
```

---

### Step 2: Start the Backend Server (Express + MongoDB)
Open your first terminal window and run:
```powershell
cd server
npm start
```
*Alternatively, from the project root:*
```powershell
npm run server
```

**What happens on launch:**
1. The backend reads `server/.env`.
2. It attempts connection to `MONGODB_URI` (`mongodb://127.0.0.1:27017/sahay`).
3. If local MongoDB is offline or not installed, it automatically activates the built-in in-memory fallback.
4. On first boot, it detects an empty database and automatically seeds 8 relief camps, 2 logistics warehouses, 21 inventory records, 5 public reports, 5 resource requests, 12 shortage alerts, 3 donations, 3 volunteers, and medical incidents.
5. The API server starts on **`http://localhost:5000`**.

---

### Step 3: Start the Frontend Client (React + Vite)
Open a second terminal window in the project root:
```powershell
cd C:\Users\Lenovo\.gemini\antigravity\scratch\sahay-platform
npm run dev
```

The frontend will start instantly on **`http://localhost:3000`**.

---

### Step 4: Open SAHAY in Your Browser
Open your browser and navigate to:
**`http://localhost:3000`**

You will see the command center overview immediately synchronized with the database!

---

## 3. Demo Roles & Authentication Credentials

The platform includes demo accounts with server-enforced permissions. You can switch personas instantly using the **Role Selector** dropdown in the top navigation bar, or log in with credentials:

| Persona | Email | Password | Role | Permissions |
|---|---|---|---|---|
| **Central Administrator** | `admin.disaster@kerala.gov.in` | `sahay123` | Central Administrator | Full authorization across all camps, approvals, allocations, alerts, and settings |
| **Camp Manager** | `anita.thomas@sahay.org` | `sahay123` | Camp Manager | Camp-specific operational access (`CAMP-01`), inventory visibility, resource requests |
| **Field Reporter** | `ground.reporter@volunteer.org` | `sahay123` | Reporter | Citizen / Volunteer need reporting, public updates |

---

## 4. End-to-End Workflow Demonstration

Follow this operational flow to test the platform:

```
[1. Submit Report] ──► [2. Verify Report] ──► [3. Convert to Request] ──► [4. Detect Shortage]
                                                                                   │
[8. Resolve Alert] ◄── [7. Deliver Receipt] ◄── [6. Dispatch Supply] ◄── [5. Approve Allocation]
```

1. **Submit Public Need Report**:
   - Go to **Public Reports** (`/reports`).
   - Click **Submit Need Report**.
   - Fill in category (e.g. `Medicines`), quantity, affected count, and address.
   - The server performs duplicate detection heuristics and records it in MongoDB.
2. **Review & Verify Report**:
   - As **Central Administrator**, click on the report in the queue.
   - Click **Verify Report**. Add reviewer notes. Status updates to `Verified`.
3. **Convert to Linked Resource Request**:
   - Click **Convert to Request**.
   - The backend creates a validated `ResourceRequest` with priority scoring and links it to the source report.
4. **Automated Shortage Detection Engine**:
   - Navigate to **Shortage Alerts** (`/alerts`).
   - The backend shortage engine evaluates stock levels against safety thresholds and verified demand, dynamically generating severity-ranked alerts (`Critical`, `High`, `Medium`).
5. **Explainable Allocation Recommendation**:
   - Open **Inventory & Allocation** (`/inventory`) or the request drawer.
   - Click **Recommend Supply Allocation**.
   - The backend allocation engine evaluates central warehouse reserves, calculates unreserved buffer, and explains why the allocation is recommended without depleting regional safety reserves.
6. **Authorize Supply Allocation**:
   - Click **Authorize Allocation**.
   - The backend validates non-negative inventory, reserves stock at the depot, and commits the transfer.
7. **Dispatch & Confirm Delivery**:
   - Click **Mark Dispatched** when transport leaves the depot.
   - Click **Confirm Delivery Receipt** when stock reaches the camp.
   - Camp inventory increases, warehouse reserved stock is cleared, and the linked request is marked `Delivered`.
8. **Automated Alert Resolution**:
   - Once stock levels meet or exceed the camp's safety threshold, the backend shortage engine resolves the alert automatically.

---

## 5. Backend REST API Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/health` | Service uptime and timestamp |
| **Auth** | `POST` | `/api/auth/login` | Login with email/password or `roleKey` demo persona |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Camps** | `GET` | `/api/camps` | List all camps (supports `?district=`, `?status=`, `?search=`) |
| **Camps** | `GET` | `/api/camps/:id` | Detailed camp record with current stock and active alerts |
| **Camps** | `POST` | `/api/camps` | Register new relief camp |
| **Camps** | `PUT` | `/api/camps/:id` | Update camp parameters (capacity, occupancy, status) |
| **Reports** | `GET` | `/api/reports` | List public reports (filtering by status, category, camp) |
| **Reports** | `POST` | `/api/reports` | Submit public report (duplicate detection active) |
| **Reports** | `POST` | `/api/reports/:id/verify` | Verify report and re-evaluate shortage demand |
| **Reports** | `POST` | `/api/reports/:id/reject` | Reject invalid or duplicate report |
| **Reports** | `POST` | `/api/reports/:id/convert-request` | Convert verified report to linked Resource Request |
| **Reports** | `POST` | `/api/reports/:id/convert-incident`| Convert verified report to Medical Incident |
| **Requests**| `GET` | `/api/requests` | List resource requests with priority scores |
| **Requests**| `POST` | `/api/requests` | Create resource request |
| **Requests**| `PATCH` | `/api/requests/:id/status` | Advance status (`Approved`, `Dispatched`, `Delivered`) |
| **Inventory**| `GET` | `/api/inventory` | Inventory balances across camps and warehouses |
| **Inventory**| `GET` | `/api/inventory/warehouses` | Central logistics hubs and buffer godowns |
| **Inventory**| `POST` | `/api/inventory/:id/adjust` | Record stock adjustment |
| **Allocations**| `GET` | `/api/allocations/recommendation/:requestId` | Generate explainable rule-based supply transfer |
| **Allocations**| `POST` | `/api/allocations` | Commit supply allocation and reserve depot stock |
| **Allocations**| `GET` | `/api/allocations` | History of authorized allocations |
| **Alerts** | `GET` | `/api/alerts` | Active shortage alerts ranked by severity |
| **Alerts** | `POST` | `/api/alerts/evaluate` | Trigger automated shortage detection recalculation |
| **Alerts** | `POST` | `/api/alerts/:id/acknowledge`| Acknowledge alert SLA clock |
| **Alerts** | `POST` | `/api/alerts/:id/resolve` | Resolve alert (verified against inventory thresholds) |
| **Donations**| `GET` | `/api/donations` | Monetary and in-kind donation ledgers |
| **Donations**| `POST` | `/api/donations` | Register new donation |
| **Volunteers**| `GET` | `/api/volunteers` | Roster of registered relief volunteers |
| **Volunteers**| `POST` | `/api/volunteers` | Register volunteer with medical/logistics skilltags |
| **Volunteers**| `POST` | `/api/volunteers/:id/assign` | Deploy volunteer to specific camp |
| **Incidents**| `GET` | `/api/incidents` | Medical and hazardous incident log |
| **Incidents**| `POST` | `/api/incidents` | Log critical incident |
| **Analytics**| `GET` | `/api/analytics/dashboard` | Aggregated command center indicators |
| **Analytics**| `GET` | `/api/analytics/activities`| Audit trail of actions |

---

## 6. Environment Configuration

### Backend (`server/.env`)
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/sahay
USE_MEMORY_DB_IF_OFFLINE=true
JWT_SECRET=sahay_humanitarian_relief_jwt_secret_key_2026_dev
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### Frontend (`.env`)
```ini
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DEMO_MODE=false
```

---

## 7. Verification & Testing

To verify the complete backend pipeline in-process, run:
```powershell
cd server
node testInProcess.js
```
This tests all 12 controllers and business logic services (Auth, Camps, Reports, Requests, Shortage Engine, Prioritization Engine, Inventory, Allocations, Donations, Volunteers, Incidents, Analytics) without requiring external network connectivity.

---

## 8. License

Developed for humanitarian relief management and hackathon presentation. All rights reserved.
