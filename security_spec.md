# Koda Firestore Security Specification

## 1. Data Invariants
1. **No Plaintext Credentials in Firestore**: Passwords are never stored in Firestore (`UserProfile` rejects any `password` or unexpected key via `keys().hasOnly(...)`). All credential hashing and storage is isolated inside Firebase Authentication.
2. **Strict Owner Isolation**: Every user profile (`/users/{userId}`) and workspace project (`/users/{userId}/projects/{projectId}`) is strictly readable and writable only when `request.auth.uid == userId` and `ownerId == request.auth.uid`.
3. **Zero Orphaned Projects**: Creating a project under `/users/{userId}/projects/{projectId}` verifies `exists(/databases/$(database)/documents/users/$(userId))` and enforces `incoming().ownerId == userId && incoming().id == projectId`.
4. **Immutable Ownership & Timestamps**: `uid`, `ownerId`, `id`, and `createdAt` cannot be modified after creation; `createdAt` and `updatedAt` must equal server `request.time`.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return `PERMISSION_DENIED`)
1. **Plaintext Password Injection**: `create /users/{uid}` with extra field `{ password: "secret" }` -> denied by `keys().hasOnly(...)`.
2. **Cross-User Profile Read**: User A `get /users/{userB}` -> denied by `isOwner(userId)`.
3. **Users Directory Scraping**: Signed-in user `list /users` -> denied by `allow list: if false`.
4. **UID Spoofing on Profile Create**: User A writes `/users/{uidA}` with `{ uid: "uidB" }` -> denied by `data.uid == request.auth.uid`.
5. **Privilege Escalation Shadow Field**: `update /users/{uidA}` adding `{ isAdmin: true }` -> denied by `affectedKeys().hasOnly(...)` & `isValidUserProfile`.
6. **Client-Spoofed Timestamp**: `create /users/{uidA}/projects/{proj}` with client date `createdAt != request.time` -> denied.
7. **Orphaned Project Write**: `create /users/{uidA}/projects/{proj}` before parent `/users/{uidA}` exists -> denied by `exists(...)`.
8. **Invalid Document ID Poisoning**: `create /users/{uidA}/projects/bad$id..with.chars` -> denied by `isValidId(projectId)`.
9. **Oversized String Exhaustion**: `create /users/{uidA}/projects/{proj}` with `title` of 5,000 characters -> denied by `title.size() <= 180`.
10. **Invalid Status/Preset Enum**: `update /users/{uidA}/projects/{proj}` setting `status: "hacked"` -> denied by `status in ['draft', 'processing', 'ready']`.
11. **Ownership Transfer Attempt**: `update /users/{uidA}/projects/{proj}` altering `ownerId` -> denied by `affectedKeys().hasOnly(...)` & `incoming().ownerId == existing().ownerId`.
12. **Unauthenticated Access**: Anonymous request reading or listing `/users/{uidA}/projects` -> denied by `request.auth != null`.
