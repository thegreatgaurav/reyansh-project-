# ISMP MVP API Contracts (Phase-1)

## Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Admin
- `GET /api/v1/admin/verifications/vendors`
- `GET /api/v1/admin/verifications/individuals`
- `PATCH /api/v1/admin/vendors/:id/approve`
- `PATCH /api/v1/admin/vendors/:id/reject`
- `PATCH /api/v1/admin/individuals/:id/approve`
- `PATCH /api/v1/admin/individuals/:id/reject`

## Vendor onboarding
- `POST /api/v1/vendors/onboarding`
- `GET /api/v1/vendors/me/status`
- `POST /api/v1/vendors/:vendorId/personnel`

## Individual onboarding
- `POST /api/v1/individuals/onboarding`
- `GET /api/v1/individuals/me/status`

## Customer jobs
- `POST /api/v1/customer/jobs`
- `GET /api/v1/customer/jobs`
- `GET /api/v1/customer/jobs/:jobId/guards`

## Attendance
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/hourly`
- `POST /api/v1/attendance/check-out`

## Location capture requirements
- Required payload on attendance endpoints:
  - `jobId`
  - `latitude`
  - `longitude`
  - `accuracyMeters`
  - `capturedAt` (ISO timestamp from client)
- Server validates radius threshold and shift-time window before accepting entry.
