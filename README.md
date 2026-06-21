# Oak Ridge Composite Squadron TN-170 — Contact Directory

A Firebase-backed contact management web application for Oak Ridge Composite Squadron TN-170 (Civil Air Patrol).

**Firebase Project:** `tn170-contact-directory` (TN-170 Contact Directory)  
**GitHub:** OakRidgeSquadronContacts

This contact directory uses its own dedicated Firebase project with Firestore collections (`contactUsers`, `contacts`), separate from the attendance tracker.

## Features

- CAPID-based login (internal email `{capid}@tn170.local`)
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
- Firebase Authentication + Firestore
- Firebase Hosting

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create or select the **TN-170 Contact Directory** Firebase project (`tn170-contact-directory`) in the [Firebase Console](https://console.firebase.google.com/). Enable Authentication (Email/Password), Firestore, and Hosting.

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

```bash
npm run seed
```

This creates 23 squadron members in Firebase Auth and `contactUsers` profiles. Initial password for each user is their CAPID.

### 6. Run locally

```bash
npm run dev
```

### 7. Build for production

```bash
npm run build
firebase deploy --only hosting
```

### 8. GitHub Pages

The app deploys automatically to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.

**Live URL:** https://tmaratos.github.io/OakRidgeSquadronContacts/

Before the first deploy succeeds, configure in the GitHub repo:

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. **Settings → Secrets and variables → Actions:** add these repository secrets (values from Firebase Console → Project Settings → Your apps → Web app):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

Firebase Hosting (`tn170-contact-directory.web.app`) uses the same build without `VITE_BASE_PATH` (defaults to `/`).

## Authentication

- **Username:** CAPID (numeric)
- **Initial password:** CAPID
- Users must change password on first login when `mustChangePassword` is `true`
- Password requirements: minimum 8 characters, cannot equal CAPID
- Forgot password: contact squadron leadership (no automated email reset)

## Firestore Collections

### `contactUsers/{uid}`

User profiles for contact directory access. Fields include CAPID, name parts, displayName, emailLogin, isActive, mustChangePassword.

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

## Import

Business card / CSV import is planned — button is disabled with "Coming soon".

## Logos

- Primary: `public/squadron-logo.svg`
- Fallback: `public/squadron-logo.jpeg`
