# Oak Ridge Composite Squadron TN-170 — Contact Directory

A Firebase-backed contact management web application for Oak Ridge Composite Squadron TN-170 (Civil Air Patrol).

**Live app:** https://tmaratos.github.io/OakRidgeSquadronContacts/  
**Login:** https://tmaratos.github.io/OakRidgeSquadronContacts/#/login

**Firebase backend:** `tn170-contact-directory` (Authentication + Firestore — not a public app URL)  
**GitHub:** OakRidgeSquadronContacts

This contact directory uses its own dedicated Firebase project with Firestore collections (`contactUsers`, `contacts`), separate from the attendance tracker.

## Features

- CAPID-based login (CAPID + password; internal auth email is never shown in the UI)
- Forced password change on first login
- Private and shared squadron contacts
- Multiple emails and phones with primary star selection
- Preferred contact method tracking
- Organization tracking with dedicated Organizations page
- Global search across names, organizations, emails, phones, notes, tags, and more
- Search and filter by category, type, status, organization, and preferred contact method
- Mobile-responsive dark navy squadron theme

## Tech Stack

- React + Vite
- Firebase Authentication + Firestore (backend)
- GitHub Pages (production hosting)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create or select the **TN-170 Contact Directory** Firebase project (`tn170-contact-directory`) in the [Firebase Console](https://console.firebase.google.com/). Enable Authentication (Email/Password) and Firestore.

Copy `.env.example` to `.env.local` and fill in your Firebase web app config from:

**Firebase Console → Project Settings → General → Your apps → Web app**

```bash
cp .env.example .env.local
```

Required variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` (should be `tn170-contact-directory`)
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 4. Deploy Firestore rules and indexes

```bash
NODE_OPTIONS=--use-system-ca firebase deploy --only firestore:rules,firestore:indexes --project tn170-contact-directory
```

Composite indexes for directory queries are defined in `firestore.indexes.json`:

- `contacts`: `ownerUid` ASC, `name` ASC
- `contacts`: `visibility` ASC, `name` ASC

Index builds can take a few minutes after deploy. Until they are ready, the Directory page shows an error instead of failing silently.

### 5. Deploy Cloud Functions (password reset — Blaze required, $0 at squadron scale)

Password reset requires Cloud Functions to look up `contactUserLookup/{capid}` and email a reset link to the **recovery email** (not the internal `{capid}@tn170.local` auth email). This cannot be done securely from the client alone.

**Requires Firebase Blaze (pay-as-you-go) plan.** Blaze is required for Cloud Functions, but this app stays within free tiers (~23 users, well under 2M function invocations/month). Upgrade at Firebase Console → Usage and billing, then:

```bash
cd functions && npm install && cd ..
NODE_OPTIONS=--use-system-ca firebase deploy --only functions --project tn170-contact-directory
```

#### Free email delivery (Resend — recommended)

[Resend](https://resend.com) offers **3,000 emails/month free** (100/day), enough for squadron password resets.

1. Create a free Resend account and generate an API key.
2. Set it on the Cloud Function (pick one method):

**Firebase secrets (recommended for 2nd gen functions):**

```bash
firebase functions:secrets:set RESEND_API_KEY --project tn170-contact-directory
# paste your re_xxx key when prompted, then redeploy functions
```

**Or legacy functions config:**

```bash
firebase functions:config:set resend.api_key="re_xxx" --project tn170-contact-directory
```

**Or Firebase Console:** Functions → requestPasswordReset → Environment variables → add `RESEND_API_KEY`.

3. Optional env vars:
   - `RESEND_FROM` — sender address (must be a verified domain in Resend; defaults to `onboarding@resend.dev` for testing)
   - `PASSWORD_RESET_CONTINUE_URL` — defaults to the GitHub Pages login URL

#### Gmail SMTP fallback (free alternative)

If you prefer Gmail instead of Resend, set these env vars on the function:

- `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`
- `SMTP_USER` — your Gmail address
- `SMTP_PASS` — a [Gmail App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
- `SMTP_FROM` (optional)

Resend is tried first when `RESEND_API_KEY` is set; SMTP is used as fallback.

#### Testing without an API key

If neither Resend nor SMTP is configured, the function still returns the generic success message (for security) and logs the reset link in Cloud Functions logs for manual testing:

Firebase Console → Functions → requestPasswordReset → Logs

Without Blaze, forgot-password shows a clear error explaining that Cloud Functions are not deployed.

#### Vercel fallback (free, if Blaze upgrade is blocked)

If you cannot enable Blaze yet, deploy the included serverless API to [Vercel](https://vercel.com) (free tier):

1. Import this repo in Vercel (one-click deploy from GitHub).
2. Set these **Environment Variables** in Vercel → Project → Settings → Environment Variables:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — paste the full JSON from your Firebase service account key (Project Settings → Service accounts → Generate new private key)
   - `RESEND_API_KEY` — your free Resend API key (`re_xxx`)
   - `RESEND_FROM` (optional) — verified sender address
   - `ALLOWED_ORIGIN` (optional) — defaults to `https://tmaratos.github.io`
3. After deploy, copy your API URL (e.g. `https://your-project.vercel.app/api/password-reset`).
4. Add to GitHub Actions secrets (or `.env.local` for local dev):
   - `VITE_PASSWORD_RESET_URL=https://your-project.vercel.app/api/password-reset`

The frontend uses `VITE_PASSWORD_RESET_URL` when set; otherwise it calls Firebase Cloud Functions.

### 6. Seed users

Place your Firebase service account key as `serviceAccountKey.json` in the project root (do not commit this file).

Optionally copy `scripts/seedUsers.local.example.json` to `scripts/seedUsers.local.json` and add recovery emails by CAPID (local only — never commit real emails):

```bash
cp scripts/seedUsers.local.example.json scripts/seedUsers.local.json
```

```bash
npm run seed
# or reset passwords on existing accounts:
node scripts/seedUsers.js --reset-passwords
```

This creates or repairs 23 squadron members in Firebase Auth and `contactUsers` profiles. Initial password for each user is their CAPID (same as username). Auth accounts use an internal `{capid}@tn170.local` email that is never displayed to users.

### 7. Run locally

```bash
npm run dev
```

### 8. Build for production

GitHub Pages builds use the project subpath. Set `VITE_BASE_PATH` when building locally to match production:

```bash
VITE_BASE_PATH=/OakRidgeSquadronContacts/ npm run build
```

Preview the production build locally:

```bash
VITE_BASE_PATH=/OakRidgeSquadronContacts/ npm run preview
```

### 9. Deploy to GitHub Pages (production)

The app deploys automatically to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.

**Canonical URL:** https://tmaratos.github.io/OakRidgeSquadronContacts/

The app uses `HashRouter`, so routes appear after `#` (for example, `#/login`).

Before the first deploy succeeds, configure in the GitHub repo:

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. **Settings → Secrets and variables → Actions:** add these repository secrets (values from Firebase Console → Project Settings → Your apps → Web app):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### Firebase project vs. hosting

The `tn170-contact-directory` Firebase project provides Authentication and Firestore only. **GitHub Pages is the sole public URL** for the contact directory.

`firebase.json` retains an optional Hosting configuration (useful for local experiments). **`firebase deploy --only hosting` is not the production deploy path** — use the GitHub Actions workflow above.

## Authentication

- **Sign in with CAPID and password** — form labels are CAPID and Password only (no email login in the UI)
- **Initial password:** same as CAPID (e.g. `729204` / `729204`)
- Internally, CAPID is converted to `{capid}@tn170.local` for Firebase Auth; users never see this
- Users must change password on first login when `mustChangePassword` is `true`
- Password requirements: minimum 8 characters, cannot equal CAPID
- Forgot password: enter CAPID + recovery email; reset link is sent to the recovery email (not the internal auth email)
- Recovery email: set during first login if missing, or updated anytime from Dashboard account settings

## Firestore Collections

### `contactUsers/{uid}`

User profiles for contact directory access. Visible identity: CAPID and displayName. Internal-only field: `internalAuthEmail` (Firebase Auth email, never displayed). Recovery email fields: `recoveryEmail`, `recoveryEmailVerified`, `recoveryEmailUpdatedAt`. Also includes name parts, isActive, mustChangePassword.

### `contactUserLookup/{capid}`

Server-only lookup index for password reset (CAPID → uid, recovery email). Not readable or writable by clients.

### `contacts/{contactId}`

Contact records with visibility `private` or `shared`. Includes name, organization, organizationNormalized, searchText, emails[], phones[], preferredContactMethod, status, address fields, contactType, category, notes, tags, and ownership metadata.

### Organization & Search Fields

- `organization` — display name for the contact's organization/agency/company/school
- `organizationNormalized` — lowercase trimmed version for grouping and search
- `searchText` — precomputed searchable text generated on create/update via `buildContactSearchText()`
- `status` — Active, Inactive, Prospect, Do Not Contact, or Other

## Security

- Active users only (`isActive == true`)
- Users read only their own `contactUsers` profile
- Shared contacts readable by all active users
- Private contacts readable only by owner
- Create/update/delete restricted to contact owner
- `ownerUid` cannot be changed after creation

## Import Contacts

Import contacts into your own account from:

- **vCard** (`.vcf`, `.vcard`) — built-in parser for FN, N, ORG, TITLE, EMAIL, TEL, URL, ADR, and NOTE
- **CSV** — auto-detects common column names (Name, Email, Phone, Organization, etc.)
- **Device Contact Picker** — when supported by the browser (Contact Picker API; primarily mobile Chrome)

Import flow: choose method → select file or device contacts → preview with selectable rows → set visibility (default **private**) → confirm import.

Before importing with **shared** visibility, you must confirm: *"You are about to share these contacts with the squadron. Only import contacts you are allowed to share."*

Duplicate detection warns when an imported contact matches an existing email, phone, or name+organization (does not block import).

Imported contacts default to private visibility with category **Community / Strategic**, contact type **Individual**, status **Active**, and tag **imported**.

## Logos

- Primary: `public/squadron-logo.svg`
- Fallback: `public/squadron-logo.jpeg`
