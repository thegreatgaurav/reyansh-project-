# ISMP Phase-1 MVP (Integrated Security Management Platform)

This repository section contains a production-oriented **Phase-1 MVP architecture** for ISMP with modular backend services, role-based frontend dashboards, and infrastructure setup.

## 1) System Architecture

### High-level design
- **Frontend**: Next.js + TailwindCSS with role-aware dashboard layouts and protected routing.
- **Backend**: Node.js + Express + Prisma + PostgreSQL, organized with modular feature domains.
- **AuthN/AuthZ**: JWT access/refresh tokens, secure rotation, HTTP-only refresh cookies, RBAC middleware.
- **Storage**: PostgreSQL for transactional data, object storage abstraction for document uploads.
- **Observability**: Structured logging + request correlation IDs.
- **Security**: Input validation, file MIME checks, size limits, signed upload URLs, audit trail.

### Architecture pattern
- Modular clean architecture:
  - `routes` (transport)
  - `controllers` (request orchestration)
  - `services` (business logic)
  - `dto/validators` (contracts + validation)
  - `db` (Prisma client + repositories)

### Trust boundaries
1. Client ↔ API Gateway (`/api/v1`)
2. API ↔ PostgreSQL (least privilege DB user)
3. API ↔ File storage (signed upload path; antivirus hook point)
4. Admin actions → audit log + approval state machine

---

## 2) Database Schema (Prisma)
See `backend/prisma/schema.prisma`.

Key entities:
- `User`, `UserRole`, `SessionToken`
- `VendorProfile`, `IndividualProfile`, `CustomerProfile`
- `VerificationRequest`, `Document`
- `JobPost`, `JobAssignment`
- `AttendanceLog`, `PresencePing`
- `AuditLog`

---

## 3) Backend Folder Structure

```text
backend/
  prisma/
    schema.prisma
  src/
    app.ts
    server.ts
    config/
    common/
      middlewares/
      utils/
      types/
    db/
      prisma.ts
    modules/
      auth/
      users/
      onboarding/
      admin/
      vendors/
      individuals/
      customers/
      jobs/
      attendance/
      files/
    logs/
```

---

## 4) API Design (REST v1)

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Onboarding
- `POST /api/v1/onboarding/vendor`
- `POST /api/v1/onboarding/individual`
- `POST /api/v1/files/presign`

### Admin
- `GET /api/v1/admin/verifications?status=PENDING&type=VENDOR`
- `POST /api/v1/admin/verifications/:id/approve`
- `POST /api/v1/admin/verifications/:id/reject`
- `GET /api/v1/admin/users`

### Vendor
- `GET /api/v1/vendor/profile`
- `POST /api/v1/vendor/personnel/link`
- `GET /api/v1/vendor/jobs/open`
- `POST /api/v1/vendor/jobs/:jobId/assign`
- `GET /api/v1/vendor/deployments`

### Individual
- `GET /api/v1/individual/assignment/current`
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/check-out`
- `POST /api/v1/attendance/presence-ping`

### Customer
- `POST /api/v1/customer/jobs`
- `GET /api/v1/customer/jobs/:id/guards`
- `GET /api/v1/customer/jobs/:id/attendance`

---

## 5) Auth Flow
1. User logs in with email + password.
2. Backend validates credential hash and account status.
3. Access token (short TTL) + refresh token (rotating) issued.
4. Refresh token stored hashed in `SessionToken`.
5. RBAC middleware checks route permissions from role matrix.
6. Admin approval gates vendor/individual functional actions.

---

## 6) Role System
Roles:
- `ADMIN`
- `VENDOR`
- `INDIVIDUAL`
- `CUSTOMER`

A user can have multiple roles through `UserRole`, but one active role context per session.

---

## 7) Admin Flow
1. Vendor/individual submits onboarding + documents.
2. System creates `VerificationRequest` in `PENDING`.
3. Admin reviews and either approves or rejects with reason.
4. On approval, system generates immutable `vendorCode` / `individualCode`.
5. System records `AuditLog` for every state transition.

---

## 8) MVP Module Implementation Plan

- **Phase A**: Auth, RBAC, User/Role, Session management.
- **Phase B**: Onboarding + file document metadata + approval workflow.
- **Phase C**: Job posting/assignment and customer visibility.
- **Phase D**: Attendance with geolocation and hourly presence pings.
- **Phase E**: Dashboards, hardened observability, deployment pipeline.

---

## 9) Code Skeletons
Implemented in `backend/src` and `frontend/src` as scalable starting points.

---

## 10) Setup Instructions

### Local prerequisites
- Node.js 20+
- Docker + Docker Compose

### Run with Docker
```bash
cd ismp-mvp
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose -f infra/docker/docker-compose.yml up --build
```

### Backend only
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Frontend only
```bash
cd frontend
npm install
npm run dev
```
