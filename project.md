# 📘 TrueOrigin — Feature List (Product Requirements)

## Documentation Index
- [backend-architechture.md](./src/backend/architecture.md) Backend system architecture documentation
- [frotnend-architechture.md](./src/frontend/architecture.md) Frontend system architecture documentation
- [backend-plans.md](./plans/backend.md) Feature plan and backlog for backend
- [frontend-plans.md](./plans/frontend.md) Feature plan and backlog for frontend

---

## 🧭 Overview
TrueOrigin is a decentralized anti-counterfeit platform powered by the Internet Computer Protocol (ICP). It allows brands to certify products using on-chain signatures, enables users to verify authenticity via QR codes, and provides rewards for verified interactions.

---

## ✅ What's Already Implemented (Backend)

- [x] ICP canister backend setup (Rust)
- [x] Organization management (creation, updates, lookup)
- [x] Product registration system
- [x] Product serial number generation
- [x] User registration and management
- [x] Authentication & authorization (organization-based)
- [x] ECDSA key pair generation for organizations
- [x] Verification system for product authenticity
- [x] Unique code generation for QR codes
- [x] In-memory storage using thread-safe collections
- [x] Structured error handling & standardized error responses
- [x] UUID generation using SHA-256 hashing

---

## 🛠️ Core Features

### 1. Product Certification (Brand-Side)
- Generate unique on-chain signatures (ECDSA) for each product.
- Store signature metadata in ICP stable memory.
- Encode certificate into a QR code.
- Prevent duplicate certificate issuance (idempotency).
- Accessible via a private brand dashboard.

### 2. QR Code Verification (User-Side)
- Scan QR → call canister to validate authenticity.
- Return product info + authenticity status.
- Check for reuse / fraud detection via signature timestamp, location (optional), or usage history.
- One-time verification logic (if needed).

### 3. Reward System (User Incentivization)
- Award users with ICP/ETH tokens (or points) for successful verifications.
- Rate-limit rewards to avoid abuse.
- Track referral codes or campaigns embedded in QR.

### 4. Sentiment Feedback (Optional AI Integration)
- After verification, prompt user to rate or leave short feedback.
- Run sentiment analysis via HTTPS outcall to AI API (e.g., OpenAI/Gemini).
- Store sentiment result and use it to trigger auto-review flags or reward boost.

---

## 🖥️ Frontend Features

### 1. Public Verification Interface
- React + Vite + Tailwind-based
- Minimalist scan-to-verify UI
- Instant feedback: genuine / invalid / already-used
- Display product info, brand, and rewards (if any)

### 2. Brand Dashboard (Authenticated)
- Upload product batches (CSV, manual)
- See verification stats
- Revoke issued certificates
- Track feedback/sentiment + performance reports

---

## 🔐 Security & Integrity

- All certification is signed using ECDSA keys generated per organization
- Enforce organization-based access control
- QR codes contain unique verification codes
- Authenticated endpoints for organization operations
- Secure random number generation using ICP's `raw_rand()`

---

## 🌐 Integration & Infrastructure

- ICP Canister for backend logic (Rust)
- Frontend hosted as separate ICP canister
- OpenAI or third-party API via HTTPS outcall (for AI/sentiment)
- Optional ETH tx trigger (for reward) via HTTPS outcall + signature relay

---

## 🔄 Future Features / Backlog
<!-- Fill this section with completed features -->

---
## 📅 Roadmap

<!-- Use format below to define roadmap milestones -->

### Q2 2025
- [ ] ⏳ Placeholder milestone
- [ ] [ ] Placeholder milestone
- [ ] [ ] Placeholder milestone

### Q3 2025
- [ ] ⏳ Placeholder milestone
- [ ] [ ] Placeholder milestone
- [ ] [ ] Placeholder milestone

---
