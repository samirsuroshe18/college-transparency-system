# College Transparency System: design

A portal where a college runs its everyday processes in the open. Students,
faculty, the administration and the college doctor each log in to one place
to hold elections, raise complaints, book facilities, file applications,
track budgets, record academic-integrity cases and handle sick leave, and
everyone can see what was decided and by whom.

The project started at HackFusion 2.0 in February 2025. This document
describes the finished version.

## Goals

- Every module works end to end and enforces who may do what.
- A visitor can try every role without signing up.
- The existing pages and their layout are kept.
- The server is covered by tests and runs on free hosting.

## Out of scope

- A visual redesign.
- Sign-in with Google.
- Real-time updates; pages load fresh data when opened or refreshed.
- Payments, timetable or attendance features.

## Roles

| Role | How the account is made | What it is for |
|---|---|---|
| Student | Sign-up, then approved by an admin | Votes, applies, complains, books, requests |
| Faculty | Sign-up, then approved by an admin | Reviews applications, records integrity cases, books facilities |
| Admin | Seed script only | Approves profiles and requests, runs elections, manages facilities |
| Doctor | Seed script only | Handles health concerns and recommends leave |

A faculty member can additionally be a **board member** (takes part in reveal
votes on anonymous complaints) and the **class coordinator** of one
department, year and division (is told when a student of that class is put
on sick leave). An admin sets both.

## Accounts

1. Sign up with name, email and password. A verification link is emailed and
   is valid for 10 minutes.
2. After verifying and logging in, the user chooses student or faculty and
   fills in the profile form. An ID proof file is optional.
3. The profile is `Pending` until an admin approves or rejects it. A rejected
   user sees the reason and can submit again.
4. Only users with an `Approved` profile can use the modules. Admin and
   doctor accounts are approved from the start.

Login, logout, forgot password and reset password work as usual. Sessions use
an httpOnly cookie. Resetting a password ends existing sessions. Sign-up,
login and password reset are limited to 30 requests per visitor and 10 per
email address in 15 minutes. Profile forms are limited to 10 per user in the
same time. Everything that changes something in the modules is limited to 60
requests per user and visitor in 15 minutes.

Email is sent through the Brevo HTTPS API when `BREVO_API_KEY` is set, and
through SMTP otherwise.

### Demo logins

The login page has four buttons: student, faculty, admin and doctor. Each
logs in to a ready-made account under `@campus.demo`. For these accounts,
logging out only ends that visitor's own session, and the password cannot be
reset.

The demo admin is a public account, so it manages the sample college only. It
does not see real sign-ups and cannot approve, reject or give duties to a
real account; those are decided by the admin created from `ADMIN_EMAIL`.
Nobody can sign up with an `@campus.demo` address, and roll numbers and
faculty IDs that start with `DEMO-` are kept for the sample college.

## Modules

Every route requires a logged-in user with an approved profile, and each
action checks the role. The lists are visible to all approved users unless
stated otherwise; that openness is the point of the system.

### Elections

- An admin creates an election: title, application deadline, voting day and
  optional eligibility by department, year and division. The deadline must be
  before the voting day.
- Stages follow from the dates: **applications open** until the deadline,
  **voting open** from the deadline to the end of the voting day, then
  **closed**. An admin can also end an election early.
- A student who meets the eligibility rules applies as a candidate before the
  deadline, once per election, with an agenda and experience. An admin
  approves or rejects each application. Once voting has started an approved
  candidate can no longer be rejected, because students may already have
  voted for them.
- An eligible student casts one vote for an approved candidate while voting
  is open. The database enforces one vote per student per election. Who voted
  for whom is never shown.
- Vote counts per candidate are visible while voting is open and afterwards.
  They are counted from the stored votes each time, not kept as a separate
  number.
- When an election closes, the candidate with the most votes is the winner.
  A tie names every tied candidate. An election with no votes has no winner.

### Complaints

- A student submits a complaint with a title, a description and an optional
  document, and chooses whether it is anonymous.
- Text containing offensive language is refused with a message that names
  the word. Words a serious complaint may need are allowed.
- Every approved user can vote a complaint up or down, once; voting again
  changes or removes the vote.
- An anonymous complaint shows no author. Board members can vote to reveal
  the author; when more than half of all board members have voted to reveal,
  the author's name is shown. A reveal cannot be undone. Only votes of people
  who are on the board at that moment count.
- An admin can mark a complaint as resolved with a note.

### Facility booking

- An admin adds facilities (name, description, location) and can mark one
  unavailable.
- A student or faculty member requests a facility for a date and a start and
  end time. The end must be after the start and the date must not be in the
  past.
- A request that overlaps an approved booking of the same facility is
  refused. Approving a request is refused for the same reason.
- An admin approves or rejects requests. The requester can cancel their own
  pending request.

### Applications

- A student submits an application in the category event, budget or
  sponsorship, with a title, a description and an optional file.
- A faculty member can add a review comment. An admin approves or rejects
  with a comment. Each step records who acted and when.
- The applicant is emailed when the application is approved or rejected.

### Budgets

- An approved user submits a budget request: what it is for, category (event,
  department, mess, other), requested amount, description and an optional
  bill.
- An admin approves it with an approved amount that is greater than zero and
  not more than the requested amount, or rejects it with a reason. The record
  keeps who decided and when.
- The list shows every request, and totals of requested and approved amounts
  per category.

### Integrity records

- A faculty member or admin records a case against a student found by roll
  number, with a reason and an optional proof file. The student's name,
  department and year are taken from their profile.
- The student is notified in the app.
- An admin can remove a record.

### Health and leave

- A student reports a health concern: symptoms, a description, urgency
  (normal or urgent) and an optional attachment.
- The doctor sees open concerns, urgent first, and records a diagnosis and a
  recommended number of leave days from 0 to 30. That closes the concern.
- When leave is recommended, the student and their class coordinator each
  get a notice in the app and an email. The emergency contact from the
  student's profile is shown to the doctor and the coordinator; it is not
  emailed.
- A student sees only their own concerns. The doctor sees all. A coordinator
  sees leave for their class.

### Dashboards and notices

- The student, faculty and admin dashboards show real figures for that user:
  open elections, pending requests waiting for them, their recent items.
- Notices are stored per user and shown under the bell: profile decisions,
  application and budget decisions, booking decisions, integrity records and
  leave. A notice can be marked as read.

## File uploads

- Files go to Cloudinary. Images (JPEG, PNG, WebP) and PDF, up to 2 MB.
- Only approved, logged-in users can upload, and every attachment is
  optional.
- Files sent from a demo account are not stored; the form is saved and says
  so.
- If Cloudinary is not configured or a file cannot be stored, the form is
  still saved and the answer says the file was left out.
- The one upload before approval is the ID proof on the profile form.

## Demo data

A sample college is created under the `@campus.demo` address: the four demo
accounts, more students and faculty including board members and a class
coordinator, and data in every module at different stages (an election
taking applications, one open for voting, one closed with a winner;
complaints with votes; facilities with bookings; applications, budgets,
integrity records and health concerns).

A demo account can change only what belongs to the sample college. It cannot
vote on, decide, review, reveal or edit anything a real user made; it can
read everything, as every approved user can.

Every time the server starts, everything that belongs to the sample college
is removed and created again, with the same account ids, so a visitor who is
logged in stays logged in. If the rebuild fails the server still starts. Accounts made by real sign-ups, and what those
users created, are kept, except their votes and comments on sample items,
which go with the items.

## API

All routes are under `/api/v1`. Errors use one shape,
`{ statusCode, message, success: false }`, with `400` invalid input, `401`
not logged in, `403` not allowed for this role or profile, `404` not found,
`409` conflicts with the current state (already voted, overlapping booking,
deadline passed) and `429` request limit reached.

| Area | Routes |
|---|---|
| Accounts | `POST /users/register`, `POST /users/login`, `GET /users/logout`, `GET /users/me`, `POST /users/forgot-password`, `GET /verify/verify-email`, `GET /verify/reset-password`, `POST /verify/verify-password` |
| Profiles | `POST /profiles/student`, `POST /profiles/faculty`, `GET /profiles/pending`, `PATCH /profiles/:userId/approve`, `PATCH /profiles/:userId/reject`, `PATCH /profiles/:userId/duties` |
| Elections | `GET /elections`, `POST /elections`, `GET /elections/:id`, `PATCH /elections/:id/end`, `POST /elections/:id/candidates`, `PATCH /elections/:id/candidates/:candidateId`, `POST /elections/:id/vote` |
| Complaints | `GET /complaints`, `POST /complaints`, `POST /complaints/:id/vote`, `POST /complaints/:id/reveal-vote`, `PATCH /complaints/:id/resolve` |
| Facilities | `GET /facilities`, `POST /facilities`, `PATCH /facilities/:id`, `GET /bookings`, `POST /bookings`, `PATCH /bookings/:id`, `DELETE /bookings/:id` |
| Applications | `GET /applications`, `POST /applications`, `PATCH /applications/:id/review`, `PATCH /applications/:id/decision` |
| Budgets | `GET /budgets`, `POST /budgets`, `PATCH /budgets/:id/decision` |
| Integrity | `GET /integrity`, `POST /integrity`, `DELETE /integrity/:id` |
| Health | `GET /health-concerns`, `POST /health-concerns`, `PATCH /health-concerns/:id/assess`, `GET /leaves` |
| Notices | `GET /notices`, `PATCH /notices/:id/read`, `PATCH /notices/read-all` |
| Dashboard | `GET /dashboard` |

## Data

**User**: name, email, password hash, verification state, role, profile
status and rejection reason, the student or faculty profile fields already in
the project, board-member flag, coordinator class, emergency contact,
session version, demo flag.

**Election**, **Candidate** (one per student per election, with status and
vote count) and **Vote** (unique per election and voter).

**Complaint** with its votes and reveal votes, **Facility**, **Booking**,
**Application**, **Budget**, **IntegrityRecord**, **HealthConcern** (with
the assessment and leave days) and **Notice**.

Every record that someone creates or decides keeps who did it and when.

## Frontend

The pages, their layout and their styling stay as they are. The work is:

- Email sign-up, verification, login and password pages replace the Google
  login; the login page gains the demo buttons.
- Every page is wired to the routes above, with loading, empty and error
  states.
- Navigation shows only what the user's role can use, and pages are
  protected by role.
- Pages that are unused or duplicated are removed, along with the duplicate
  router file and UI libraries that nothing uses any more.
- The web app talks to `/api`, which is forwarded to the server in
  development and in production, so the login cookie stays on the web app's
  own address.

## Project structure

```
backend/
  src/
    app.js, index.js
    controllers/, routes/, models/, middlewares/
    utils/              mail, uploads, notices, helpers
    scripts/seed.js     sample college
  tests/
frontend/
  src/
    api/, components/, pages/, redux/, config/
docs/
  design.md
```

Folder and file names inside the modules are made consistent (lower case,
one spelling) as each module is worked on.

## Testing

- Server: Jest and Supertest against an in-memory MongoDB. Email and uploads
  are replaced by fakes, so tests never call an outside service.
- Covered for every module: who may do what, what a user may see, input
  checks, and the rules that matter most: one vote per student, eligibility,
  election stages and winners, one complaint vote per user, the reveal
  majority, no overlapping approved bookings, approved amount limits, and
  who is notified about leave.
- Web app: lint and build, and each flow checked by hand in a browser for
  every role.

## Deployment

- Server on Render, web app on Vercel, database on MongoDB Atlas, email
  through Brevo, files on Cloudinary.
- The sample college is rebuilt whenever the server starts, which on a free
  plan that sleeps when idle happens several times a day.

## Environment variables

| Key | Purpose |
|---|---|
| `MONGODB_URI` | Database connection string |
| `PORT`, `SERVER_HOST`, `NODE_ENV` | Where and how the server runs |
| `CORS_ORIGIN`, `FRONTEND_URL` | Web app address, for CORS and email links |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY` | Access token signing |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY` | Refresh token signing |
| `BREVO_API_KEY`, `MAIL_FROM` | Email over HTTPS |
| `MAIL_HOST`, `EMAIL_PORT`, `MAIL_USER`, `MAIL_PASS` | Email over SMTP, when Brevo is not set |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | File uploads, optional |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional. A real admin account created by the seed script |
| `SEED_ON_START` | Rebuild the sample college when the server starts, `true` in production |
