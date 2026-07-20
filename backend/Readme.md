# MamaRise API Reference — For Frontend

**Base URL (local dev):** `http://127.0.0.1:5000`
**Base URL (staging/prod):** TBD — update this doc once deployed

All endpoints are prefixed `/api/v1/`. Everything below requires JSON
request bodies (`Content-Type: application/json`) and returns JSON.

---

## 1. Standard response shape

Every endpoint, success or failure, returns this same envelope:

```json
{ "success": true, "data": { ... }, "error": null }
```

```json
{ "success": false, "data": null, "error": { "code": "SOME_CODE", "message": "Human-readable message", "details": { } } }
```

**Always check `success` first**, not the HTTP status code alone — the
shape is consistent so you can branch on `error.code` for specific
handling (e.g. show a different message for `TOKEN_EXPIRED` vs
`VALIDATION_ERROR`), and fall back to `error.message` for anything else.

`error.details` is only present on `VALIDATION_ERROR` (422) responses —
it's a field-by-field breakdown, useful for highlighting specific form
fields.

---

## 2. Authentication flow — what you need to implement

### Registering

```
POST /api/v1/auth/register
```
```json
{
  "email": "user@example.com",
  "phone_number": "0712345678",
  "password": "StrongPass123!",
  "full_name": "Jane Doe",
  "consent_given": true,
  "consent_version": "v1"
}
```
- `phone_number` accepts `07XXXXXXXX`, `01XXXXXXXX`, or `+254XXXXXXXXX` — the backend normalizes it to `+254XXXXXXXXX` and returns it that way. Display it back to the user in whatever format they typed if you want, but store/send what the backend gives you.
- Password requirements (validate this client-side too, for instant feedback): 10+ characters, 1 uppercase, 1 lowercase, 1 number, 1 special character.
- `consent_given` must be `true` or the request is rejected — this should be a checkbox gating the submit button, not a hidden default.
- Returns `access_token`, `refresh_token`, and the `user` object on success (201).

### Logging in

```
POST /api/v1/auth/login
```
```json
{ "email": "user@example.com", "password": "StrongPass123!" }
```
Same response shape as register. On wrong credentials, you get a generic `INVALID_CREDENTIALS` (401) — the message doesn't distinguish "wrong password" from "no such account," so don't build UI that assumes it does.

Other login-specific errors to handle:
- `ACCOUNT_LOCKED` (423) — too many failed attempts, tell the user to wait and try later.
- `ACCOUNT_DISABLED` (403) — account deactivated.

### Storing tokens

- **`access_token`**: short-lived (15 min). Send it as `Authorization: Bearer <token>` on every protected request.
- **`refresh_token`**: long-lived (30 days). Use it to get a new pair when the access token expires.
- Store both securely (e.g. secure storage on mobile, httpOnly-style handling or secure storage on web — avoid plain `localStorage` if you can help it).

### Refreshing

```
POST /api/v1/auth/refresh
```
Send the **refresh token** as the Bearer token on this call (not the access token). Returns a brand new access + refresh pair. **The old refresh token stops working the moment you get a new one** — always replace both tokens in storage, not just the access token.

Recommended pattern: catch `401` with `error.code === "TOKEN_EXPIRED"` on any API call, silently call `/auth/refresh`, retry the original request once. If refresh also fails, send the user to login.

### Logging out

```
POST /api/v1/auth/logout
```
Requires the access token as Bearer. This **actually revokes the token server-side** — it's not just a client-side "forget the token" action. After calling this, that access token is dead everywhere, immediately.

### Forgot password (SMS OTP)

```
POST /api/v1/auth/forgot-password
```
```json
{ "phone_number": "0712345678" }
```
Always returns the same generic success message, whether or not that number is registered — **don't build UI that reveals which numbers are registered.** A 6-digit code is sent via SMS (or printed server-side in local dev, since SMS credentials aren't configured yet).

```
POST /api/v1/auth/reset-password
```
```json
{ "phone_number": "0712345678", "otp_code": "123456", "new_password": "NewPass123!" }
```
Code expires in 10 minutes, max 5 attempts. On success, the user should be sent to login (their session isn't automatically logged in after reset).

### Getting the current user

```
GET /api/v1/auth/me
```
Requires access token. Returns the user's profile — useful for rehydrating app state after a refresh/reload if you've stored the token but not the user object.

The user object now includes `baby_birth_date` (ISO date string or `null`) and `postpartum_weeks` (integer or `null`) — see the dedicated section on updating these below.

### Updating the profile — setting the birth date

```
PATCH /api/v1/auth/me
```
```json
{ "full_name": "New Name", "baby_birth_date": "2026-06-07" }
```
Both fields optional — send only what you're changing. This is how the postpartum-week indicator gets its data; it isn't collected at signup, so build a prompt somewhere post-registration (onboarding flow or a settings screen) that lets the user enter it. Send `"baby_birth_date": null` to clear it.

- Rejects future dates with `422`.
- `postpartum_weeks` in the response is `null` until a birth date is set — don't show the indicator UI until it's a real number.

---

## 3. Planner endpoints

All require the access token. A user only ever sees their own plan — there's no way to fetch another user's plan even by ID.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/planner/plans` | Create a plan (auto-generates checklist by work type) |
| GET | `/api/v1/planner/plans/me` | Get the user's plan + checklist + childcare, all together |
| PATCH | `/api/v1/planner/plans/<plan_id>` | Update `work_type` or `return_date` |
| DELETE | `/api/v1/planner/plans/<plan_id>` | Delete the plan |
| POST | `/api/v1/planner/plans/<plan_id>/checklist` | Add a custom checklist item |
| PATCH | `/api/v1/planner/checklist/<item_id>` | Toggle complete / edit an item |
| DELETE | `/api/v1/planner/checklist/<item_id>` | Remove an item |
| PUT | `/api/v1/planner/plans/<plan_id>/childcare` | Set/update childcare details |

**`work_type` values:** `remote`, `corporate`, `hybrid`, `gig`, `informal`, `other`
**Checklist `category` values:** `logistics`, `career`, `wellbeing`

Notes:
- Creating a new plan **replaces** any existing one — there's only ever one active plan per user.
- Editing `work_type` on an existing plan does **not** regenerate the checklist automatically — this was a deliberate choice so users don't lose their checked-off progress. If you want a "regenerate" action, that'd need its own explicit button/confirmation, not something that happens silently on edit.
- `GET /plans/me` returns `404` if the user hasn't created a plan yet — treat that as "show the create-a-plan onboarding flow," not an error state.

---

## 4. Wellbeing endpoints

All require the access token. **This data is completely private** — there is no employer-facing view of check-in data anywhere in the backend, by design.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/wellbeing/checkins` | Log a mood/stress/sleep check-in |
| GET | `/api/v1/wellbeing/checkins` | Paginated history (`?page=&per_page=`) |
| GET | `/api/v1/wellbeing/checkins/today` | Has the user checked in today + the latest entry |
| GET | `/api/v1/wellbeing/summary` | Rolling average (`?days=`, default 7) |
| GET | `/api/v1/wellbeing/breathing-exercise` | Static guided breathing content |

- `mood_score` and `stress_score` are both integers 1–5 — build these as sliders, not free text.
- The check-in response includes `"suggest_breathing_exercise": true/false`, based on the stress score. **Use this to prompt the breathing exercise UI right after a stressful check-in** — that's the "Gentle Support" moment from the product walkthrough. It's a UX nudge, not a clinical flag — don't build any alerting or escalation logic around it.

---

## 5. Appointments/Reminders endpoints

All require the access token. A user only ever sees their own milestones and preferences.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/appointments/milestones` | Create a milestone |
| GET | `/api/v1/appointments/milestones` | List timeline, soonest first (`?include_completed=true` to show past ones too) |
| GET | `/api/v1/appointments/milestones/upcoming` | Single next milestone — built specifically for a "next appointment" card |
| PATCH | `/api/v1/appointments/milestones/<id>` | Update / mark complete |
| DELETE | `/api/v1/appointments/milestones/<id>` | Delete |
| GET | `/api/v1/appointments/notification-preferences` | Get toggle states |
| PATCH | `/api/v1/appointments/notification-preferences` | Update toggle states |

**Milestone `type` values:** `pediatric_checkup`, `family_planning`, `postpartum_checkup`, `vaccination`, `other`

Notification preferences (`daily_wellbeing_nudges`, `vitamin_reminders`, `milestone_reminders`) all default to `true` and don't exist until first touched — you don't need to do anything special on signup, just call `GET` and it'll create sane defaults automatically.

---

## 6. Dashboard endpoint

```
GET /api/v1/dashboard
```
Requires the access token. This is the one to call for the home/"Morning Greeting" screen — it pulls Planner + Wellbeing + Appointments together so you don't need 3-4 separate calls.

```json
{
  "greeting": "Good morning, Amina",
  "postpartum_weeks": 6,
  "has_checked_in_today": true,
  "todays_checkin": { "...or null" },
  "next_milestone": { "...or null" },
  "return_to_work": {
    "has_plan": true,
    "weeks_remaining": 10,
    "top_tasks": [ "...up to 3 incomplete checklist items" ]
  }
}
```

Every field degrades gracefully — a brand-new user with nothing set up gets `null`/`false`/`[]` everywhere, not an error. Build the empty states around that (e.g. `has_plan: false` → show a "create your return-to-work plan" prompt instead of the task list; `postpartum_weeks: null` → hide that indicator until the user has entered a birth date via `PATCH /auth/me`).

**This endpoint is read-only and cheap to call** — safe to call every time this screen mounts, no need to cache aggressively client-side.

---

## 7. Billing / Employer endpoints

Two separate concerns live here: a personal **Subscription** (Freemium tier), and **Employer organizations** that mothers can join for workplace-sponsored access.

### Subscription (any authenticated user, any role)

```
GET /api/v1/billing/subscription
```
Returns the user's current tier and status:
```json
{ "tier": "free", "status": "active", "updated_at": "..." }
```
Created automatically with `free`/`active` defaults the first time it's read — nothing special needed at signup.

```
POST /api/v1/billing/subscription/upgrade
```
```json
{ "tier": "premium" }
```
**Important — this is a stub, not a working payment flow.** There is no M-Pesa or card payment gateway wired up yet. Calling this sets `status` to `"pending_payment"` and returns an explanatory message — it does **not** charge anyone or unlock premium features. Do not build a "your upgrade is complete" screen around this response; build a "we've received your request, payment confirmation is pending" screen instead. See section 9 for what's planned here.

### Employer organizations

Role-gated: some endpoints require `role: "employer"`, others require `role: "mother"`. A `403 FORBIDDEN` means the logged-in user's role doesn't match what the endpoint needs — this is expected behavior, not a bug, if e.g. a mother-role account calls an employer-only endpoint.

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | `/api/v1/billing/employers` | employer | Create your organization (one per employer account) — returns an `invite_code` |
| GET | `/api/v1/billing/employers/me` | employer | Get your org's info + invite code |
| GET | `/api/v1/billing/employers/me/stats` | employer | Aggregate roster stats (counts + average completion, no names) |
| GET | `/api/v1/billing/employers/me/roster` | employer | **Named** roster — see privacy note below |
| POST | `/api/v1/billing/employers/join` | mother | Join an org using its invite code |
| GET | `/api/v1/billing/employers/my-enrollment` | mother | Check your own enrollment status |
| POST | `/api/v1/billing/employers/leave` | mother | Leave your current organization |

**Employer roster privacy — build UI around this carefully:**
```json
{
  "roster": [
    { "enrollment_id": "...", "mother_name": "Amina Wanjiru", "enrolled_at": "...", "planner_completion_percentage": 33.3 },
    { "enrollment_id": "...", "mother_name": "Grace Njeri", "enrolled_at": "...", "planner_completion_percentage": null }
  ]
}
```
This is the **only** employer-facing view that includes names, and it is intentionally limited to name + Return-to-Work Planner completion percentage. **Nothing from Wellbeing (mood, stress, sleep, check-in notes) is ever included here or in any employer-facing endpoint.** `planner_completion_percentage` is `null`, not `0`, for a mother who hasn't created a plan yet — treat `null` as "no data yet," not "0% progress," when designing the employer dashboard UI.

Seats are limited by `seat_limit` set at org creation — joining returns `409 SEAT_LIMIT_REACHED` once full.

---

## 8. Not built yet

- Real payment processing for the subscription upgrade (see section 9)
- Email verification flow

---

## 9. Project status: paused pending funding

As of this document, the backend covers the full MVP feature set from the product walkthrough — Auth, Return-to-Work Planner, Wellbeing check-ins, Appointments/Reminders, the Dashboard aggregator, and Employer/Billing (including named roster) — all built and manually tested end-to-end, including explicit tests confirming the Wellbeing privacy boundary holds even under direct attempts to leak data through employer-facing endpoints.

**What's intentionally not built:** a real payment gateway integration (M-Pesa STK Push + Visa/Mastercard). This requires a registered business/merchant account with a payment provider (Pesapal is the current recommendation for Kenya — one integration covers both M-Pesa and cards), which in turn depends on funding/business registration steps outside engineering's control. The `/subscription/upgrade` endpoint exists as a stub so the frontend can build against the expected shape now, without blocking on that funding.

**When funded**, the payment work involves: choosing/confirming the provider, obtaining sandbox then production credentials, building a `Payment`/`Transaction` model with an audit trail, webhook signature verification, idempotent webhook handling (a payment confirmation must never be applied twice), and the same rigorous end-to-end testing every other module in this backend has had — sandbox test coverage should include successful and failed/cancelled/timed-out payments for both M-Pesa and card, not just the happy path.

Until then, the prototype is fully functional and demoable end-to-end on the Freemium tier — every screen from the product walkthrough has a working, tested API behind it except real payment collection.

---

## 10. General notes

- **CORS**: the backend only accepts requests from explicitly whitelisted origins (set via `CORS_ORIGINS` in the backend's `.env`). If you're getting CORS errors, it means your dev URL (e.g. `http://localhost:5173`) needs to be added there — ping the backend team, don't work around it client-side.
- **Rate limiting**: register (5/hour), login (10/15min), forgot-password (3/15min), reset-password (5/15min) are all throttled. If you're hammering these during dev/testing and get a `429 RATE_LIMITED`, that's expected — just wait or use a different test account.
- **Dates**: all dates are ISO 8601 strings (`"2026-10-01"` for dates, full timestamps for `created_at`/`updated_at`). Parse with your standard date library, no custom format handling needed.
- **IDs**: everything uses UUIDs (strings), not incrementing integers.

Questions or if an endpoint doesn't behave like this doc says, flag it — this reflects everything tested and merged as of the Employer/Billing module. This is the full MVP feature set; the backend is stable and ready to build the frontend against. The only piece intentionally not working yet is real payment collection.