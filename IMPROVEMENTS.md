# OpenHome Improvement Proposals: Logic & Design

This document outlines recommended improvements for the OpenHome project, focusing on code quality, security, scalability, and user experience.

## 1. Backend Architecture & Logic

### 1.1 Service Layer Implementation
**Current State:** Express routes are tightly coupled with Prisma logic, handling both request parsing and database operations.
**Improvement:** Decouple routes from business logic by introducing a Service Layer. Routes should only handle request validation and response formatting, while services handle business rules and database interactions.
**Benefit:** Improved testability (unit tests for services), better reusability, and cleaner code.

### 1.2 Data Transfer Objects (DTOs) & Transformers
**Current State:** Prisma models are often returned directly to the client, leading to manual stripping of sensitive fields like `pinHash`.
**Improvement:** Implement DTOs or a transformation layer (e.g., using a library like `class-transformer` or simple mapping functions).
**Benefit:** Prevents accidental data leaks, ensures consistent API responses, and allows for different data shapes for different user roles (e.g., parent vs. child).

### 1.3 Request Validation
**Current State:** Basic manual checks for required fields in routes.
**Improvement:** Use a schema validation library like **Zod** or **Joi** to validate incoming request bodies, query parameters, and URL parameters.
**Benefit:** Robust error handling, automatic type safety, and cleaner route logic.

### 1.4 Global Response Interceptor
**Current State:** Manual parsing of JSON strings (e.g., `jars`, `photos`) in every route.
**Improvement:** Implement a global middleware/interceptor in Express that automatically parses designated JSON string fields from Prisma models before sending the response.
**Benefit:** Eliminates redundant logic and reduces the risk of bugs caused by missing `JSON.parse()` calls.

## 2. Database & Data Integrity

### 2.1 Prisma Middleware/Extensions for JSON Fields
**Current State:** SQLite stores complex objects (arrays, nested objects) as JSON strings, requiring manual serialization.
**Improvement:** Use Prisma client extensions or middleware to automatically handle `JSON.parse` and `JSON.stringify` for specific fields.
**Benefit:** Seamless interaction with complex data types within the application logic.

### 2.2 Atomic Transactions
**Current State:** Some multi-step operations are already in transactions, but others might benefit from stricter atomic guarantees.
**Improvement:** Audit all multi-model updates (e.g., chore completion + point awarding) to ensure they are fully wrapped in Prisma transactions.
**Benefit:** Prevents data inconsistency in case of partial failures.

### 2.3 Decimal Handling
**Current State:** `Decimal` types in Prisma/SQLite can sometimes lead to precision issues if not handled carefully in JavaScript.
**Improvement:** Use a library like `decimal.js` for all financial/allowance calculations and ensure consistent string-to-decimal conversion.
**Benefit:** Accurate financial tracking for child allowances.

## 3. Real-Time Communication

### 3.1 Serverless-Friendly Real-Time Solution
**Current State:** Socket.io is used, which is incompatible with stateless serverless environments like Vercel.
**Improvement:** Migrate from Socket.io to a hosted realtime service like **Pusher**, **Ably**, or **Upstash (Redis-based)**.
**Benefit:** Enables reliable real-time chat and notifications on serverless deployments.

## 4. Security

### 4.1 Secret Management
**Current State:** JWT/Refresh secrets have insecure defaults for development.
**Improvement:** Implement a configuration loader that requires these secrets to be set in all environments. Use a secret management service (e.g., AWS Secrets Manager, HashiCorp Vault) for production.
**Benefit:** Significantly improves the security posture of the application.

### 4.2 Profile Switching Security
**Current State:** Family-level PIN is used for initial login, but profile switching is open.
**Improvement:** Add an optional "Personal PIN" for parent profiles to prevent children from accessing parent-only features (e.g., distributing allowance, creating chores).
**Benefit:** Enhanced privacy and parental control.

### 4.3 Rate Limiting
**Current State:** No rate limiting on authentication or sensitive endpoints.
**Improvement:** Implement rate limiting (e.g., using `express-rate-limit`) on login and registration routes.
**Benefit:** Protects against brute-force attacks.

## 5. UI/UX & Frontend

### 5.1 Consistent Loading & Error States
**Current State:** Basic alerts and console logs for error handling.
**Improvement:** Implement a global notification system (toasts) and standardized loading skeletons or spinners.
**Benefit:** Provides a more professional and user-friendly experience.

### 5.2 PWA Optimization
**Current State:** Basic PWA structure.
**Improvement:** Enhance the `manifest.json` and service worker to support offline access for core features like chore viewing and chat history.
**Benefit:** Improved usability in areas with spotty internet connection.

### 5.3 Enhanced Store Management
**Current State:** Simple Zustand store.
**Improvement:** Use Zustand's middleware for persistence and consider splitting the store into modules (auth, chores, chat) as the app grows.
**Benefit:** Better organization and automatic state recovery after page refreshes.

## 6. Developer Experience (DX)

### 6.1 Linting & Formatting Standards
**Current State:** Basic ESLint setup.
**Improvement:** Implement a 'strict' linting configuration for CI/PRs while allowing a 'relaxed' mode for local development. Integrate Prettier for consistent formatting.
**Benefit:** Ensures high code quality without hindering development speed.

### 6.2 Automated Testing
**Current State:** Minimal testing.
**Improvement:** Add unit tests for services (using Vitest) and End-to-End (E2E) tests for critical paths like registration and chore completion (using Playwright).
**Benefit:** Increases confidence in code changes and prevents regressions.
