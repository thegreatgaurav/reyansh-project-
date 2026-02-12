# ISMP Phase-1 MVP (Production Architecture Blueprint)

This module provides a production-ready architecture baseline for **ISMP (Integrated Security Management Platform)** with role-based workflows for Admin, Vendor, Individual Security Personnel, and Customer.

## 1) System Architecture

### Architecture style
- **Frontend**: Next.js (App Router) + Tailwind CSS + role-aware dashboard routing.
- **Backend**: Node.js + Express + modular clean architecture (`routes -> controller -> service -> repository`), with centralized validation, logging, and error middleware.
- **Database**: PostgreSQL + Prisma ORM.
- **Storage**: S3-compatible object storage for KYC/onboarding docs (with signed URLs).
- **Auth**: JWT access + refresh tokens, rotation, revocation, secure httpOnly cookies for session continuity.
- **Infra**: Docker Compose for local/dev and baseline deployment.

### Bounded modules
- `auth`: login, token refresh, logout, session lifecycle.
- `users`: multi-role user profile and platform actors.
- `vendor`: onboarding documents, admin approval flow, code generation.
- `individual`: onboarding documents, approval flow, code generation.
- `jobs`: customer posting, vendor assignment, guard deployment.
- `attendance`: check-in/check-out, hourly confirmation, GPS capture.
- `admin`: verification queues, approvals/rejections, user oversight.

### Security-first controls
- Strong payload validation using schema validators.
- File type + size restrictions and malware-scan integration point.
- RBAC + route-level and resource-level authorization.
- Audit logs for approvals, assignments, attendance edits.
- PII protection with encrypted storage for sensitive IDs.
- IP/device metadata capture for auth/session events.

## 2) Database Schema
- Prisma schema is available at `backend/prisma/schema.prisma`.
- Covers users, roles, onboarding requests, verification actions, jobs, assignments, attendance logs, location points, and refresh sessions.

## 3) Backend Folder Structure

```txt
backend/
  prisma/
    schema.prisma
  src/
    app.ts
    server.ts
    config/
      env.ts
    core/
      errors/
        api-error.ts
      logger/
        logger.ts
    middlewares/
      auth.middleware.ts
      role.middleware.ts
      error.middleware.ts
      validate.middleware.ts
    modules/
      auth/
      admin/
      users/
      vendor/
      individual/
      customer/
      jobs/
      attendance/
    routes/
      index.ts
```

## 4) API Design (MVP)
See `backend/src/routes/index.ts` for grouped route map. Highlights:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/vendors/onboarding`
- `PATCH /api/v1/admin/vendors/:id/approve`
- `PATCH /api/v1/admin/individuals/:id/approve`
- `POST /api/v1/customer/jobs`
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/hourly`

## 5) Auth Flow
1. User submits email/password.
2. System validates user + active status + role eligibility.
3. Server issues access token (short TTL) + refresh token (long TTL, rotation).
4. Refresh session persisted with hash + device metadata.
5. Role claims embedded minimally in JWT (`sub`, `role`, `permissionsVersion`).
6. Middleware enforces authentication and role-permission checks.

## 6) Role System
- User can hold one primary platform role in Phase-1 (`ADMIN`, `VENDOR`, `INDIVIDUAL`, `CUSTOMER`).
- Vendor can manage linked individual personnel through assignment records.
- All sensitive endpoints enforce role middleware and ownership checks.

## 7) Admin Flows
- Admin opens verification queue (`vendor` and `individual`).
- Admin reviews docs and verification notes.
- Admin approves/rejects and system generates code:
  - Vendor: `VND-<REGION>-<SEQ>`
  - Individual: `IND-<REGION>-<SEQ>`
- Audit entry and notification event emitted.

## 8) MVP Module Implementation Plan
1. Foundation: env config, logger, error pipeline, prisma setup.
2. Auth: login/refresh/logout/session revocation.
3. Onboarding: vendor + individual document flow and status machine.
4. Admin: queue APIs and approval/rejection processors.
5. Customer jobs: create/list/status APIs.
6. Vendor assignment: map guards to jobs.
7. Attendance: check-in/out + hourly signal + location points.
8. Frontend MVP dashboards by role.

## 9) Code Skeletons
- Backend starter skeleton and middleware are under `backend/src`.
- Frontend role-layout skeleton in `frontend/src/app`.

## 10) Setup Instructions
```bash
cd ismp-mvp
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose up --build
```

App URLs (default):
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/api/v1`
- PostgreSQL: `localhost:5432`

