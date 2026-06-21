# Oak Ridge Composite Squadron TN-170 — Contact Directory

A Firebase-backed contact management web application for Oak Ridge Composite Squadron TN-170 (Civil Air Patrol).

**Firebase Project:** `tn170-attendance` (TN-170 Attendance Tracker)  
**GitHub:** OakRidgeSquadronContacts

This contact directory uses dedicated Firestore collections (`contactUsers`, `contacts`) and does not interfere with the attendance tracker data.

## Features

- CAPID-based login (internal email `{capid}@tn170.local`)
- Forced password change on first login
- Private and shared squadron contacts
- Multiple emails and phones with primary star selection
- Preferred contact method tracking
- Search and filter across all contact fields
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

Copy `.env.example` to `.env.local` and fill in your Firebase web app config from:

**Firebase Console → Project Settings → General → Your apps → Web app**

```bash
cp .env.example .env.local
```

Required variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` (should be `tn170-attendance`)
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

Contact records with visibility `private` or `shared`. Includes name, organization, emails[], phones[], preferredContactMethod, address fields, contactType, category, notes, tags, and ownership metadata.

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
