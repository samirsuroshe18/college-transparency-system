# College Transparency System

A portal where a college runs its everyday processes in the open. Students,
faculty, the administration and the college doctor each log in to one place,
and everyone can see what was decided and by whom.

The project started at HackFusion 2.0 in February 2025 and was completed
afterwards. [docs/design.md](docs/design.md) describes the whole design.

## What it does

| Module | What happens in it |
|---|---|
| Accounts and profiles | Sign-up with email verification. Students and faculty fill a profile that an admin approves before they can use the system |
| Dashboard and notices | Each role sees the figures that concern it, and gets a notice when something is decided about them |
| Elections | An admin opens an election. Students apply as candidates, the admin approves them, each eligible student votes once, and the counts are public |
| Complaints | Students raise complaints and everyone votes on them. An anonymous author is revealed only when a majority of the board members votes for it |
| Facility booking | Students and faculty ask for a hall or a lab. An admin approves, and two approved bookings can never overlap |
| Applications | Students apply for events, budgets and sponsorships. Faculty add a review, an admin decides, and the applicant gets an email |
| Budgets | Students and faculty ask for money. An admin approves all or part of it, or rejects with a reason. Every request and the totals per category are public |
| Academic integrity | Faculty record cases of cheating against a student's roll number. The records are public and the student is told |
| Health and leave | A student writes to the college doctor. The doctor answers and can give medical leave. The class coordinator is told the days of the leave and nothing about the illness |

## Roles

| Role | How the account is made | What it can do |
|---|---|---|
| Student | Sign-up, then approved by an admin | Vote, stand in elections, raise complaints, book facilities, apply, ask for budgets, write to the doctor |
| Faculty | Sign-up, then approved by an admin | Review applications, book facilities, ask for budgets, record integrity cases. A board member votes on revealing anonymous complaints; a class coordinator sees the medical leave of the class |
| Admin | Created when the server starts, from `ADMIN_EMAIL` and `ADMIN_PASSWORD` | Approves profiles, candidates, bookings, applications and budgets, resolves complaints, gives duties to faculty |
| Doctor | Part of the sample college | Reads health concerns, answers them and gives leave |

Health concerns are private: only the student and the doctor read them.
Admins have no access to them.

## Demo accounts

The login page has a button for each role. Every account uses the password
`Demo@123`.

| Role | Email |
|---|---|
| Student | `student@campus.demo` |
| Faculty | `faculty@campus.demo` |
| Admin | `admin@campus.demo` |
| Doctor | `doctor@campus.demo` |

They belong to a sample college: more students and faculty, profiles waiting
for the admin, and content in every module in different states. The demo
faculty member is a board member and the coordinator of the demo student's
class.

### How the demo protects real data

The demo accounts are public, so they are fenced in:

- Everything in the sample college is marked as sample data. A demo account
  can change sample data only; a write to anything a real person made is
  refused.
- The demo admin sees and decides about sample accounts only. Real sign-ups
  are approved by the admin from `ADMIN_EMAIL`.
- The demo doctor and the demo coordinator see the health data of sample
  students only.
- Files attached by a demo account are not stored, and no email is sent to a
  sample address.
- Nobody can sign up with a `@campus.demo` address.
- With `SEED_ON_START=true` the sample college is rebuilt every time the
  server starts, which undoes whatever visitors did to it. Real accounts and
  their data are not touched.

## Tech stack

| Part | Stack |
|---|---|
| Frontend | React 19, Vite, Redux Toolkit, MUI with Toolpad, Tailwind CSS |
| Backend | Node.js, Express, MongoDB with Mongoose, JSON Web Tokens, Nodemailer, Multer, Cloudinary |
| Tests | Jest, Supertest, in-memory MongoDB |

## Getting started

### Prerequisites

- Node.js 20 or newer
- A MongoDB connection string (local MongoDB or MongoDB Atlas)
- SMTP credentials or a Brevo API key for the verification and reset emails
- Optional: a Cloudinary account for file attachments

### Setup

```bash
cd backend
npm install
cp .env.example .env     # then fill in the values, see below

cd ../frontend
npm install
```

### Environment variables

`backend/.env`:

| Key | Purpose |
|---|---|
| `MONGODB_URI` | Database connection string |
| `PORT`, `SERVER_HOST` | Where the server listens (`3002`, `localhost`) |
| `CORS_ORIGIN` | Web app origin (`http://localhost:5176`) |
| `FRONTEND_URL` | Base URL used in email links (`http://localhost:5176`) |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY` | Access token signing, for example a long random string and `1d` |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY` | Refresh token signing, for example a long random string and `10d` |
| `MAIL_HOST`, `EMAIL_PORT`, `MAIL_USER`, `MAIL_PASS` | SMTP settings |
| `BREVO_API_KEY`, `MAIL_FROM` | Optional. Send email through the Brevo HTTPS API instead of SMTP |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional. Without them, forms work but attachments are not stored |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional. An admin account created when the server starts |
| `COLLEGE_UTC_OFFSET_MINUTES` | Optional. How far the college is from UTC, in minutes. Defaults to `330` (India). Booking days, voting days and leave days are days at the college |
| `SEED_ON_START` | `true` rebuilds the sample college every time the server starts |

### Run

Start the server and the web app in two terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Open <http://localhost:5176>. The web app forwards `/api` to the server on
port 3002.

### Sample college

```bash
cd backend
npm run seed
```

This builds the sample college described under
[Demo accounts](#demo-accounts). Running it again rebuilds the sample
college and touches nothing else.

To try the sign-up flow end to end, set `ADMIN_EMAIL` and `ADMIN_PASSWORD`:
accounts made by signing up are approved by that admin.

### Tests

```bash
cd backend
npm test
```

The tests start their own in-memory database. They never send email and never
upload a file.

## Deployment

The server and the web app are deployed separately.

- **Server**: any Node.js host. Set the environment variables above, with
  `CORS_ORIGIN` and `FRONTEND_URL` pointing at the web app, and
  `SEED_ON_START=true` for a public demo. The start command is `npm start`
  in `backend`. On hosts that block SMTP ports, use `BREVO_API_KEY`.
- **Web app**: a static build of `frontend` (`npm run build`).
  `frontend/vercel.json` forwards `/api` to the server, so the login cookie
  stays on the web app's own address; put the server's address there.

## Files

Attachments are optional everywhere: an ID proof on a profile, a document on
a complaint, a file on an application, a bill on a budget request, proof on
an integrity record, a report on a health concern. A file is a JPEG, PNG or
WebP image or a PDF of at most 2 MB, sent by a logged-in user.

## API overview

Every route is under `/api/v1` and answers
`{ statusCode, data, message, success }`. Login is kept in an httpOnly
cookie. Apart from the account routes, every route needs a login and an
approved profile.

| Route | Who | Purpose |
|---|---|---|
| `POST /users/register`, `POST /users/login`, `GET /users/logout`, `GET /users/me` | everyone | Accounts |
| `POST /users/forgot-password`, `GET /verify/verify-email`, `GET /verify/reset-password`, `POST /verify/verify-password` | everyone | Email verification and password reset |
| `POST /profiles/student`, `POST /profiles/faculty` | new users | Submit a profile |
| `GET /profiles/pending`, `PATCH /profiles/:userId/approve`, `PATCH /profiles/:userId/reject` | admin | Decide about profiles |
| `GET /profiles/faculty`, `PATCH /profiles/:userId/duties` | admin | Board members and class coordinators |
| `GET /dashboard` | all | The figures for the caller's role |
| `GET /notices`, `PATCH /notices/:id/read`, `PATCH /notices/read-all` | all | Notices |
| `GET /elections`, `GET /elections/:id` | all | Elections with candidates and counts |
| `POST /elections`, `PATCH /elections/:id/end`, `PATCH /elections/:id/candidates/:candidateId` | admin | Open and end elections, decide about candidates |
| `POST /elections/:id/candidates`, `POST /elections/:id/vote` | student | Stand and vote |
| `GET /complaints`, `POST /complaints/:id/vote` | all | Read and vote on complaints |
| `POST /complaints` | student | Raise a complaint |
| `POST /complaints/:id/reveal-vote` | board member | Vote to reveal an anonymous author |
| `PATCH /complaints/:id/resolve` | admin | Resolve a complaint |
| `GET /facilities`, `GET /bookings` | all | Facilities and their bookings |
| `POST /facilities`, `PATCH /facilities/:id`, `PATCH /bookings/:id` | admin | Manage facilities, decide about bookings |
| `POST /bookings`, `DELETE /bookings/:id` | student, faculty | Ask for a booking, cancel one's own |
| `GET /applications` | all | Applications |
| `POST /applications` | student | Apply |
| `PATCH /applications/:id/review` | faculty | Add a review |
| `PATCH /applications/:id/decision` | admin | Approve or reject |
| `GET /budgets` | all | Budget requests and totals per category |
| `POST /budgets` | student, faculty | Ask for a budget |
| `PATCH /budgets/:id/decision` | admin | Approve an amount or reject |
| `GET /integrity` | all | Integrity records |
| `POST /integrity` | faculty, admin | Record a case |
| `DELETE /integrity/:id` | admin | Remove a record |
| `POST /health-concerns` | student | Write to the doctor |
| `GET /health-concerns` | student, doctor | A student's own concerns; the doctor sees all |
| `PATCH /health-concerns/:id/assess` | doctor | Answer and give leave |
| `GET /leaves` | student, class coordinator, doctor | Leave days, without anything medical |

## Project structure

```
backend/
  src/
    app.js              Express app, routes and error handling
    index.js            Starts the server
    controllers/        Request handlers, one per module
    middlewares/        Login, roles, uploads, request limits
    models/             User, Notice, Election, Candidate, Vote, Complaint, Facility,
                        Booking, Application, Budget, IntegrityRecord, HealthConcern
    routes/             Route definitions
    utils/              Mail, uploads, notices, college time, input checks
    scripts/            Sample college
  tests/
frontend/
  src/
    api/                Requests to the server, one file per module
    components/         Frame, session guards, shared pieces
    pages/              Pages, by module
    redux/              Login state and on-screen messages
    lib/                Fixed lists and helpers
docs/
  design.md             Design of the system
```

## Team

Built by Samir Suroshe ([@samirsuroshe18](https://github.com/samirsuroshe18)),
Tanishq Kulkarni ([@TanishqMSD](https://github.com/TanishqMSD)),
Mohit Dhangar ([@mohit45v](https://github.com/mohit45v)) and
Pranay Sanap ([@pranaysanap](https://github.com/pranaysanap)).
