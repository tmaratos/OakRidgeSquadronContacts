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

### 3. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

### 4. Create Firestore indexes

When you first run queries, Firebase may prompt you to create composite indexes for:

- `contacts`: `ownerUid` ASC, `name` ASC
- `contacts`: `visibility` ASC, `name` ASC

Create these in the Firebase Console if prompted.

### 5. Seed users

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

### 6. Run locally

```bash
npm run dev
```

### 7. Build for production

GitHub Pages builds use the project subpath. Set `VITE_BASE_PATH` when building locally to match production:

```bash
VITE_BASE_PATH=/OakRidgeSquadronContacts/ npm run build
```

Preview the production build locally:

```bash
VITE_BASE_PATH=/OakRidgeSquadronContacts/ npm run preview
```

### 8. Deploy to GitHub Pages (production)

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
