# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowPay is a mobile-first escrow platform where brands fund creator deals upfront, and funds auto-release upon deliverable approval. The platform uses existing payment rails (Stripe Connect) with a pluggable Payments Abstraction Layer (PAL) for future crypto support.

## Architecture

### Dual Architecture Setup
FlowPay supports both Lovable development and production deployment:

**Lovable Environment:**
- `/src/` - React web app with Supabase backend
- Landing page at `/` with trust-building elements
- Dashboard at `/dashboard` for authenticated users
- Real-time Supabase integration

**Production Environment:**
- `/app-mobile/` - React Native (Expo) mobile application
- `/backend/` - Node.js + TypeScript + Fastify API server
- `/infra/` - Infrastructure as code

### Core Components

**Payments Abstraction Layer (PAL)**: Interface-based system in `/backend/src/payments/`
- `PaymentsProvider.ts` - Core interface
- `StripeConnectProvider.ts` - Production implementation
- `CryptoProvider.ts` - Stub for future crypto payouts

**Data Models**: Prisma ORM with PostgreSQL
- Users (creators, brands, admins) with KYC status
- Deals with escrow state machine (DRAFT → FUNDED → RELEASED/REFUNDED)
- Milestones with approval timers and auto-release
- Deliverables with file hashing and validation
- Audit trail via Events table

**Core Workflows**:
1. Brand creates Deal → Creator accepts → Escrow created
2. Brand funds via Stripe → Money held in connected account
3. Creator submits deliverable → Brand approves (or timer expires)
4. Auto-release payment to Creator with invoice generation

## Development Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
npm run typecheck    # TypeScript checks
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed development data

# Mobile App
cd app
npm run start        # Start Expo development
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run test         # Run tests

# Root
npm run dev          # Start all services concurrently
npm run test:all     # Run all tests
npm run lint:all     # Lint all code
```

## Environment Setup

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis for BullMQ job queue
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `S3_*` - S3-compatible storage credentials
- `JWT_SECRET` - JWT signing secret

## Key Implementation Details

**Authentication**: JWT with role-based access (CREATOR/BRAND/ADMIN)

**File Upload**: S3-compatible storage with SHA-256 hashing for integrity verification

**Webhooks**: Stripe Connect webhooks at `/webhooks/stripe` with idempotency and retry handling

**State Management**: Deal state machine prevents invalid transitions, enforced at database and API level

**Auto-release**: BullMQ jobs handle milestone timer expiry (default 5 days)

**Invoicing**: PDF generation on milestone release with VAT/reverse-charge logic for EU B2B

**Testing Strategy**:
- Unit tests for PAL interface and deal state machine
- Integration tests for Stripe webhooks with signed fixtures
- E2E test covering full happy path: create → fund → submit → approve → release

## Security & Compliance

- PII encryption at rest
- Stripe handles KYC/KYB - never store full PAN
- S3 private buckets with presigned URLs
- GDPR data mapping with deletion endpoints
- Rate limiting on payment-mutating endpoints
- Idempotency keys for financial operations

## Development Workflow

1. Always run tests before committing: `npm run test:all`
2. Lint and typecheck: `npm run lint:all && npm run typecheck:all`
3. Use conventional commits for clear history
4. Seed data includes demo Brand/Creator with funded deal for testing
5. Use ngrok for local webhook testing with Stripe
6. Test with Stripe test cards in development

## Future Extensibility

- `CryptoProvider` stub ready for USDC implementation
- Content provenance hooks in `checks/c2pa.ts`
- Mangopay provider structure in `providers/mangopay/`
- Pluggable deliverable validation system