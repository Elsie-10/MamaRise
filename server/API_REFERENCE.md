# MamaRise Server API Reference

This document lists every API route exposed by the Flask server under the v1 API namespace.

Base URL:

- http://localhost:<port>/api/v1

Authentication:

- Most endpoints require a JWT in the Authorization header.
- Header format: Authorization: Bearer <access_token>
- Refresh tokens are used only on the refresh endpoint and are not used for normal protected routes.

Common response envelope:

- Success: { "success": true, "data": {...}, "error": null }
- Failure: { "success": false, "data": null, "error": { "code": "ERROR_CODE", "message": "Human readable message", "details": {...} } }

Status codes:

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Validation Error
- 423 Locked

---

## 1) Authentication API

### POST /api/v1/auth/register

Creates a new user account.

Required body:

```json
{
  "email": "user@example.com",
  "phone_number": "0712345678",
  "password": "StrongPass1!",
  "full_name": "Jane Doe",
  "role": "mother",
  "consent_given": true,
  "consent_version": "v1"
}
```

Validation rules:

- email must be valid
- password must be at least 10 characters, contain uppercase, lowercase, number, and special character
- phone must be a valid Kenyan number, such as 0712345678, 0112345678, +254712345678, or 254712345678
- consent_given must be true
- role may be mother or employer

Success response body:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone_number": "+254712345678",
      "full_name": "Jane Doe",
      "role": "mother",
      "is_email_verified": false,
      "baby_birth_date": null,
      "postpartum_weeks": null,
      "created_at": "2026-09-15T12:34:56.789Z"
    },
    "access_token": "jwt",
    "refresh_token": "jwt"
  },
  "error": null
}
```

---

### POST /api/v1/auth/login

Logs in a user.

Required body:

```json
{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone_number": "+254712345678",
      "full_name": "Jane Doe",
      "role": "mother",
      "is_email_verified": false,
      "baby_birth_date": null,
      "postpartum_weeks": null,
      "created_at": "2026-09-15T12:34:56.789Z"
    },
    "access_token": "jwt",
    "refresh_token": "jwt"
  },
  "error": null
}
```

---

### POST /api/v1/auth/refresh

Refreshes the JWT pair using a valid refresh token.

Authentication:

- Requires a refresh token in Authorization header with jwt_required(refresh=True)

Returns:

```json
{
  "success": true,
  "data": {
    "access_token": "new_access_jwt",
    "refresh_token": "new_refresh_jwt"
  },
  "error": null
}
```

---

### POST /api/v1/auth/logout

Logs the current user out and revokes the presented token.

Authentication:

- Requires access token

Returns:

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  },
  "error": null
}
```

---

### GET /api/v1/auth/me

Gets the current authenticated user's public profile.

Authentication:

- Requires access token

Success response data:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone_number": "+254712345678",
  "full_name": "Jane Doe",
  "role": "mother",
  "is_email_verified": false,
  "baby_birth_date": "2026-06-15",
  "postpartum_weeks": 12,
  "created_at": "2026-09-15T12:34:56.789Z"
}
```

---

### PATCH /api/v1/auth/me

Updates the current user profile.

Authentication:

- Requires access token

Optional body:

```json
{
  "full_name": "Jane Smith",
  "baby_birth_date": "2026-06-15"
}
```

Success response body contains the updated public user object.

---

### POST /api/v1/auth/forgot-password

Starts the password reset flow by sending a one-time passcode to a phone number.

Request body:

```json
{
  "phone_number": "0712345678"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "message": "If this number is registered, a verification code has been sent."
  },
  "error": null
}
```

---

### POST /api/v1/auth/reset-password

Resets the password after OTP verification.

Request body:

```json
{
  "phone_number": "0712345678",
  "otp_code": "123456",
  "new_password": "NewStrongPass1!"
}
```

Validation:

- otp_code must be 6 digits
- new_password follows same strength rules as registration

Success response:

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully. Please log in."
  },
  "error": null
}
```

---

## 2) Appointments / Milestones API

### POST /api/v1/appointments/milestones

Creates a milestone for the authenticated user.

Authentication:

- Requires access token

Request body:

```json
{
  "title": "Pediatric checkup",
  "type": "pediatric_checkup",
  "due_date": "2026-10-15",
  "notes": "Bring vaccination records"
}
```

Supported milestone types:

- pediatric_checkup
- family_planning
- postpartum_checkup
- vaccination
- other

Success response data:

```json
{
  "id": "uuid",
  "title": "Pediatric checkup",
  "type": "pediatric_checkup",
  "due_date": "2026-10-15",
  "notes": "Bring vaccination records",
  "is_completed": false,
  "created_at": "2026-09-15T12:34:56.789Z"
}
```

---

### GET /api/v1/appointments/milestones

Lists milestones for the authenticated user.

Authentication:

- Requires access token

Query params:

- include_completed=true|false (default false)

Success response data:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Pediatric checkup",
      "type": "pediatric_checkup",
      "due_date": "2026-10-15",
      "notes": "Bring vaccination records",
      "is_completed": false,
      "created_at": "2026-09-15T12:34:56.789Z"
    }
  ]
}
```

---

### GET /api/v1/appointments/milestones/upcoming

Gets the next upcoming uncompleted milestone for the authenticated user.

Authentication:

- Requires access token

Success response data:

```json
{
  "milestone": {
    "id": "uuid",
    "title": "Pediatric checkup",
    "type": "pediatric_checkup",
    "due_date": "2026-10-15",
    "notes": "Bring vaccination records",
    "is_completed": false,
    "created_at": "2026-09-15T12:34:56.789Z"
  }
}
```

If no next milestone exists, milestone is null.

---

### PATCH /api/v1/appointments/milestones/<milestone_id>

Updates a specific milestone.

Authentication:

- Requires access token

Optional body:

```json
{
  "title": "Updated title",
  "type": "vaccination",
  "due_date": "2026-11-01",
  "notes": "New note",
  "is_completed": true
}
```

Success response data: updated milestone object.

---

### DELETE /api/v1/appointments/milestones/<milestone_id>

Deletes a milestone owned by the authenticated user.

Authentication:

- Requires access token

Success response data:

```json
{
  "message": "Milestone deleted."
}
```

---

### GET /api/v1/appointments/notification-preferences

Gets the current user's notification preferences.

Authentication:

- Requires access token

Success response data:

```json
{
  "daily_wellbeing_nudges": true,
  "vitamin_reminders": true,
  "milestone_reminders": true,
  "updated_at": "2026-09-15T12:34:56.789Z"
}
```

---

### PATCH /api/v1/appointments/notification-preferences

Updates notification preferences.

Authentication:

- Requires access token

Optional body:

```json
{
  "daily_wellbeing_nudges": false,
  "vitamin_reminders": true,
  "milestone_reminders": false
}
```

Success response data: updated preferences object.

---

## 3) Billing and Employer API

### GET /api/v1/billing/subscription

Returns the authenticated user's subscription record.

Authentication:

- Requires access token

Success response data:

```json
{
  "tier": "free",
  "status": "active",
  "updated_at": "2026-09-15T12:34:56.789Z"
}
```

Valid subscription tiers:

- free
- premium

Valid subscription statuses:

- active
- pending_payment
- cancelled

---

### POST /api/v1/billing/subscription/upgrade

Creates a subscription upgrade request.

Authentication:

- Requires access token

Request body:

```json
{
  "tier": "premium"
}
```

Success response data:

```json
{
  "subscription": {
    "tier": "premium",
    "status": "pending_payment",
    "updated_at": "2026-09-15T12:34:56.789Z"
  },
  "message": "Upgrade request recorded. Payment processing isn't wired up yet - this will be confirmed manually until M-Pesa integration is built."
}
```

---

### POST /api/v1/billing/employers

Creates an employer organization.

Authentication:

- Requires access token
- Role must be employer

Request body:

```json
{
  "name": "MamaRise Clinic",
  "seat_limit": 25
}
```

Success response data:

```json
{
  "id": "uuid",
  "name": "MamaRise Clinic",
  "seat_limit": 25,
  "invite_code": "A1B2C3D4",
  "active_seat_count": 0,
  "created_at": "2026-09-15T12:34:56.789Z"
}
```

---

### GET /api/v1/billing/employers/me

Gets the authenticated employer's organization.

Authentication:

- Requires access token
- Role must be employer

Success response data:

```json
{
  "id": "uuid",
  "name": "MamaRise Clinic",
  "seat_limit": 25,
  "invite_code": "A1B2C3D4",
  "active_seat_count": 0,
  "created_at": "2026-09-15T12:34:56.789Z"
}
```

---

### GET /api/v1/billing/employers/me/stats

Gets aggregate employer statistics.

Authentication:

- Requires access token
- Role must be employer

Success response data:

```json
{
  "enrolled_count": 10,
  "mothers_with_active_plan": 7,
  "average_planner_completion_percentage": 68.4
}
```

This endpoint intentionally excludes personal wellbeing data.

---

### GET /api/v1/billing/employers/me/roster

Gets the organization roster for employer review.

Authentication:

- Requires access token
- Role must be employer

Success response data:

```json
{
  "roster": [
    {
      "enrollment_id": "uuid",
      "mother_name": "Jane Doe",
      "enrolled_at": "2026-09-15T12:34:56.789Z",
      "planner_completion_percentage": 81.2
    }
  ]
}
```

This endpoint exposes only mother name and planner progress, not wellbeing or private check-in details.

---

### POST /api/v1/billing/employers/join

Joins a mother to an employer organization using an invite code.

Authentication:

- Requires access token
- Role must be mother

Request body:

```json
{
  "invite_code": "A1B2C3D4"
}
```

Success response data:

```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "status": "active",
  "enrolled_at": "2026-09-15T12:34:56.789Z"
}
```

---

### GET /api/v1/billing/employers/my-enrollment

Gets the authenticated mother's current active enrollment.

Authentication:

- Requires access token
- Role must be mother

Success response data:

```json
{
  "enrollment": {
    "id": "uuid",
    "organization_id": "uuid",
    "status": "active",
    "enrolled_at": "2026-09-15T12:34:56.789Z"
  }
}
```

If the user is not enrolled, enrollment is null.

---

### POST /api/v1/billing/employers/leave

Removes the authenticated mother from her employer organization.

Authentication:

- Requires access token
- Role must be mother

Success response data:

```json
{
  "message": "You've left the organization."
}
```

---

## 4) Dashboard API

### GET /api/v1/dashboard

Returns the dashboard summary for the authenticated user.

Authentication:

- Requires access token

Success response data:

```json
{
  "greeting": "Good morning, Jane",
  "postpartum_weeks": 12,
  "has_checked_in_today": true,
  "todays_checkin": {
    "id": "uuid",
    "mood_score": 4,
    "stress_score": 3,
    "sleep_hours": 7.5,
    "note": "Feeling better today",
    "created_at": "2026-09-15T08:10:00.000Z"
  },
  "next_milestone": {
    "id": "uuid",
    "title": "Pediatric checkup",
    "type": "pediatric_checkup",
    "due_date": "2026-10-15",
    "notes": "Bring vaccination records",
    "is_completed": false,
    "created_at": "2026-09-15T12:34:56.789Z"
  },
  "return_to_work": {
    "has_plan": true,
    "weeks_remaining": 6,
    "top_tasks": [
      {
        "id": "uuid",
        "title": "Finalize childcare plan",
        "category": "logistics",
        "is_completed": false,
        "is_custom": true,
        "position": 0
      }
    ]
  }
}
```

---

## 5) Planner API

### POST /api/v1/planner/plans

Creates a return-to-work plan for the authenticated user.

Authentication:

- Requires access token

Request body:

```json
{
  "work_type": "remote",
  "return_date": "2026-12-01"
}
```

Valid work types:

- remote
- corporate
- hybrid
- gig
- informal
- other

Success response data:

```json
{
  "id": "uuid",
  "work_type": "remote",
  "return_date": "2026-12-01",
  "weeks_remaining": 9,
  "created_at": "2026-09-15T12:34:56.789Z",
  "updated_at": "2026-09-15T12:34:56.789Z",
  "checklist_items": [
    {
      "id": "uuid",
      "title": "Update CV",
      "category": "career",
      "is_completed": false,
      "is_custom": false,
      "position": 0
    }
  ],
  "childcare_arrangement": null
}
```

Note: Creating a new plan replaces the user's previous active plan.

---

### GET /api/v1/planner/plans/me

Gets the current user's return-to-work plan.

Authentication:

- Requires access token

Success response data: same structure as the plan object returned by POST /plans.

---

### PATCH /api/v1/planner/plans/<plan_id>

Updates a plan's work_type or return_date.

Authentication:

- Requires access token

Optional body:

```json
{
  "work_type": "hybrid",
  "return_date": "2026-12-15"
}
```

Success response data: updated plan object.

---

### DELETE /api/v1/planner/plans/<plan_id>

Deletes a plan owned by the authenticated user.

Authentication:

- Requires access token

Success response data:

```json
{
  "message": "Plan deleted."
}
```

---

### POST /api/v1/planner/plans/<plan_id>/checklist

Adds a custom checklist item to a plan.

Authentication:

- Requires access token

Request body:

```json
{
  "title": "Arrange childcare backup",
  "category": "logistics"
}
```

Valid categories:

- logistics
- career
- wellbeing

Success response data:

```json
{
  "id": "uuid",
  "title": "Arrange childcare backup",
  "category": "logistics",
  "is_completed": false,
  "is_custom": true,
  "position": 4
}
```

---

### PATCH /api/v1/planner/checklist/<item_id>

Edits or toggles a checklist item.

Authentication:

- Requires access token

Optional body:

```json
{
  "title": "Updated childcare item",
  "category": "wellbeing",
  "is_completed": true
}
```

Success response data: updated checklist item object.

---

### DELETE /api/v1/planner/checklist/<item_id>

Deletes a checklist item.

Authentication:

- Requires access token

Success response data:

```json
{
  "message": "Checklist item deleted."
}
```

---

### PUT /api/v1/planner/plans/<plan_id>/childcare

Creates or updates the childcare arrangement for a plan.

Authentication:

- Requires access token

Request body:

```json
{
  "primary_caregiver": "Mother's mother",
  "backup_plan": "School-age sibling after 3pm",
  "commute_notes": "15-minute walk to the office"
}
```

Success response data:

```json
{
  "id": "uuid",
  "primary_caregiver": "Mother's mother",
  "backup_plan": "School-age sibling after 3pm",
  "commute_notes": "15-minute walk to the office",
  "updated_at": "2026-09-15T12:34:56.789Z"
}
```

---

## 6) Wellbeing API

### POST /api/v1/wellbeing/checkins

Creates a wellbeing check-in for the authenticated user.

Authentication:

- Requires access token

Request body:

```json
{
  "mood_score": 4,
  "stress_score": 3,
  "sleep_hours": 7.5,
  "note": "I feel more rested today."
}
```

Validation rules:

- mood_score: integer 1-5
- stress_score: integer 1-5
- sleep_hours: optional float 0-24
- note: optional text up to 1000 chars

Success response data:

```json
{
  "id": "uuid",
  "mood_score": 4,
  "stress_score": 3,
  "sleep_hours": 7.5,
  "note": "I feel more rested today.",
  "created_at": "2026-09-15T08:10:00.000Z",
  "suggest_breathing_exercise": false
}
```

The response also includes a boolean suggest_breathing_exercise based on stress threshold logic.

---

### GET /api/v1/wellbeing/checkins

Lists check-ins for the authenticated user with pagination.

Authentication:

- Requires access token

Query params:

- page (default 1, min 1)
- per_page (default 20, min 1, max 100)

Success response data:

```json
{
  "items": [
    {
      "id": "uuid",
      "mood_score": 4,
      "stress_score": 3,
      "sleep_hours": 7.5,
      "note": "I feel more rested today.",
      "created_at": "2026-09-15T08:10:00.000Z"
    }
  ],
  "page": 1,
  "per_page": 20,
  "total": 12,
  "total_pages": 1
}
```

---

### GET /api/v1/wellbeing/checkins/today

Returns whether the user has checked in today and includes the latest check-in if present.

Authentication:

- Requires access token

Success response data:

```json
{
  "has_checked_in_today": true,
  "checkin": {
    "id": "uuid",
    "mood_score": 4,
    "stress_score": 3,
    "sleep_hours": 7.5,
    "note": "I feel more rested today.",
    "created_at": "2026-09-15T08:10:00.000Z"
  }
}
```

---

### GET /api/v1/wellbeing/summary

Gets a rolling summary of wellbeing metrics over the last N days.

Authentication:

- Requires access token

Query params:

- days (default 7, min 1, max 90)

Success response data:

```json
{
  "period_days": 7,
  "checkin_count": 3,
  "average_mood": 4.0,
  "average_stress": 3.0,
  "average_sleep_hours": 7.3
}
```

If there are no check-ins, values may be null.

---

### GET /api/v1/wellbeing/breathing-exercise

Returns the static guided breathing exercise content for the app.

Authentication:

- Requires access token

Success response data:

```json
{
  "title": "2-Minute Guided Breathing",
  "duration_seconds": 120,
  "steps": [
    { "instruction": "Breathe in slowly through your nose", "seconds": 4 },
    { "instruction": "Hold gently", "seconds": 4 },
    { "instruction": "Breathe out slowly through your mouth", "seconds": 6 },
    { "instruction": "Pause before your next breath", "seconds": 2 }
  ],
  "repeat": 8
}
```

---

## 7) API Summary

Listed endpoints by area:

Auth

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- PATCH /api/v1/auth/me
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password

Appointments

- POST /api/v1/appointments/milestones
- GET /api/v1/appointments/milestones
- GET /api/v1/appointments/milestones/upcoming
- PATCH /api/v1/appointments/milestones/<milestone_id>
- DELETE /api/v1/appointments/milestones/<milestone_id>
- GET /api/v1/appointments/notification-preferences
- PATCH /api/v1/appointments/notification-preferences

Billing

- GET /api/v1/billing/subscription
- POST /api/v1/billing/subscription/upgrade
- POST /api/v1/billing/employers
- GET /api/v1/billing/employers/me
- GET /api/v1/billing/employers/me/stats
- GET /api/v1/billing/employers/me/roster
- POST /api/v1/billing/employers/join
- GET /api/v1/billing/employers/my-enrollment
- POST /api/v1/billing/employers/leave

Dashboard

- GET /api/v1/dashboard

Planner

- POST /api/v1/planner/plans
- GET /api/v1/planner/plans/me
- PATCH /api/v1/planner/plans/<plan_id>
- DELETE /api/v1/planner/plans/<plan_id>
- POST /api/v1/planner/plans/<plan_id>/checklist
- PATCH /api/v1/planner/checklist/<item_id>
- DELETE /api/v1/planner/checklist/<item_id>
- PUT /api/v1/planner/plans/<plan_id>/childcare

Wellbeing

- POST /api/v1/wellbeing/checkins
- GET /api/v1/wellbeing/checkins
- GET /api/v1/wellbeing/checkins/today
- GET /api/v1/wellbeing/summary
- GET /api/v1/wellbeing/breathing-exercise

---

This file was generated by reviewing the Flask blueprints and model serialization layer in the server application.
