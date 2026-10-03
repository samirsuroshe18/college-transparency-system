# College Transparency System

A portal where a college runs its everyday processes in the open. Students,
faculty, the administration and the college doctor each log in to one place,
and everyone can see what was decided and by whom.

The project started at HackFusion 2.0 in February 2025.

## Status

The system is being completed in stages. See [docs/design.md](docs/design.md)
for the whole design.

| Part | State |
|---|---|
| Accounts with email verification, four roles | Done |
| Student and faculty profiles, approved by an admin | Done |
| Faculty duties: board member, class coordinator | Done |
| Notices and dashboard | Done |
| Demo accounts for every role | Done |
| Elections, complaints, facility booking, applications | Next |
| Budgets, integrity records, health and leave | After that |

## Roles

| Role | How the account is made |
|---|---|
| Student | Sign-up, then approved by an admin |
| Faculty | Sign-up, then approved by an admin |
| Admin | Created when the server starts, from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. This admin approves real sign-ups |
| Doctor | Part of the sample college |

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

This creates a sample college under the `@campus.demo` address: one account
for each role, more students and faculty, and two profiles waiting for the
admin. Every account uses the password `Demo@123`.

| Role | Email |
|---|---|
| Student | `student@campus.demo` |
| Faculty | `faculty@campus.demo` |
| Admin | `admin@campus.demo` |
| Doctor | `doctor@campus.demo` |

The login page has a button for each of them. Running the script again
rebuilds the sample college and touches nothing else.

The demo admin manages the sample college only. Accounts made by signing up
are approved by the admin from `ADMIN_EMAIL`, so set that to try the sign-up
flow end to end.

### Tests

```bash
cd backend
npm test
```

The tests start their own in-memory database. They never send email and never
upload a file.

## Project structure

```
backend/
  src/
    app.js              Express app, routes and error handling
    index.js            Starts the server
    controllers/        Request handlers
    middlewares/        Login, roles, uploads, request limit
    models/             User, Notice
    routes/             Route definitions
    utils/              Mail, uploads, notices, helpers
    scripts/            Sample college
  tests/
frontend/
  src/
    api/                Requests to the server
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
