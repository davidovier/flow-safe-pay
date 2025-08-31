# FlowPay - Instant Creator Payment Platform

FlowPay is a mobile-first escrow platform where brands fund creator deals upfront, and funds auto-release upon deliverable approval. Built with existing payment rails (Stripe Connect) and designed with a pluggable Payments Abstraction Layer for future crypto support.

## 🏗️ Architecture

### Monorepo Structure
```
├── app/                 # React Native (Expo) mobile application
├── backend/             # Node.js + TypeScript + Fastify API server
├── infra/              # Infrastructure as code (Docker, CI/CD)
├── CLAUDE.md           # Development guidance for Claude Code
└── README.md           # This file
```

### Tech Stack

**Backend:**
- **Runtime:** Node.js + TypeScript
- **Framework:** Fastify with OpenAPI documentation
- **Database:** PostgreSQL with Prisma ORM
- **Queue:** BullMQ (Redis)
- **Payments:** Stripe Connect with Payments Abstraction Layer
- **Storage:** S3-compatible (Cloudflare R2) with SHA-256 hashing
- **Auth:** JWT with role-based access control

**Mobile App:**
- **Framework:** React Native with Expo
- **State Management:** Redux Toolkit
- **Navigation:** Expo Router
- **Storage:** Expo SecureStore for tokens

**Infrastructure:**
- **Development:** Docker compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Structured logging with metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Stripe account with test keys

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Environment setup:**
```bash
cp ../.env.example .env
# Edit .env with your database and Stripe credentials
```

3. **Database setup:**
```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed with demo data
```

4. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3001` with documentation at `http://localhost:3001/docs`.

### Mobile App Setup

1. **Install dependencies:**
```bash
cd app
npm install
```

2. **Start Expo development server:**
```bash
npm start
```

3. **Run on device/simulator:**
```bash
npm run ios     # iOS Simulator
npm run android # Android Emulator
```

### Environment Variables

Create `.env` file in the root directory (see `.env.example`):

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/flowpay

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# S3 Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=flowpay-files

# JWT
JWT_SECRET=your-super-secret-jwt-key

# App URLs
API_BASE_URL=http://localhost:3001
APP_BASE_URL=http://localhost:3000
```

## 🏃‍♂️ Development Workflow

### Available Scripts

**Backend:**
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
npm run typecheck    # TypeScript type checking
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio
```

**Mobile App:**
```bash
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm run web         # Run in web browser
npm run test        # Run tests
npm run lint        # Lint code
```

**Root (both):**
```bash
npm run dev:all     # Start both backend and app
npm run test:all    # Run all tests
npm run lint:all    # Lint all code
```

### Demo Credentials
```
Brand User:   brand@example.com / password123
Creator User: creator@example.com / password123  
Admin User:   admin@flowpay.com / password123
```

## 💳 Stripe Setup

### 1. Create Connected Accounts
Set up Express accounts for brands and creators:
```bash
curl -X POST http://localhost:3001/stripe/connect/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userType": "creator", "email": "creator@example.com", "country": "US"}'
```

### 2. Webhook Configuration
Configure Stripe webhooks to point to `https://your-domain.com/webhooks/stripe` with these events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.updated`
- `payout.created`
- `payout.updated`
- `account.updated`

### 3. Local Webhook Testing
Use ngrok for local development:
```bash
# Install ngrok and expose your local server
ngrok http 3001

# Use the ngrok URL for Stripe webhook endpoint
# https://abc123.ngrok.io/webhooks/stripe
```

## 🔧 Core Features

### Payment Flows

**1. Deal Creation & Acceptance:**
- Brand creates deal with milestones
- Creator accepts terms
- Escrow created via Stripe Connect

**2. Funding:**
- Brand funds deal via Stripe payment
- Funds held in connected account (no custody)
- Deal state updated to FUNDED

**3. Deliverable Submission:**
- Creator uploads files with SHA-256 hashing
- Automatic validation checks run
- Brand has 5-day SLA to approve

**4. Auto-release:**
- Funds auto-release if no response within SLA
- Manual approval triggers instant payout
- Invoice automatically generated

### Payments Abstraction Layer (PAL)

The system uses a pluggable payment interface:

```typescript
interface PaymentsProvider {
  createEscrow(dealId: string, currency: string): Promise<{ escrowId: string }>;
  fundEscrow(escrowId: string, amountCents: number, brandUserId: string): Promise<{ paymentRef: string }>;
  releaseToCreator(escrowId: string, amountCents: number, creatorUserId: string, metadata?: any): Promise<{ payoutRef: string }>;
  refundToBrand(escrowId: string, amountCents?: number): Promise<{ refundRef: string }>;
  getStatus(escrowId: string): Promise<{ state: 'unfunded'|'funded'|'released'|'refunded' }>;
}
```

**Current Implementations:**
- ✅ `StripeConnectProvider` - Production ready
- 🚧 `CryptoProvider` - Scaffold for USDC payments
- 🚧 `MangopayProvider` - Placeholder for European markets

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### Integration Testing
Test the full payment flow:
```bash
# 1. Register users
# 2. Create and accept deal
# 3. Fund with Stripe test card (4242 4242 4242 4242)
# 4. Submit deliverable
# 5. Approve milestone
# 6. Verify payout completed
```

### Webhook Testing
Use Stripe CLI to forward webhook events:
```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
```

## 📱 Mobile App Features

### Authentication
- Email/password login with JWT
- Role-based UI (Creator vs Brand)
- Secure token storage with Expo SecureStore

### Creator Flow
- View accepted deals
- Submit deliverables (file + URL)
- Track milestone progress
- View payout history

### Brand Flow  
- Create deals with milestones
- Fund via Stripe payment
- Review and approve deliverables
- Monitor deal performance

### File Upload
- Presigned S3 URLs for secure uploads
- SHA-256 integrity verification
- Support for images, videos, PDFs
- File size limits configurable

## 🔒 Security & Compliance

### Data Protection
- PII encrypted at rest
- JWT with short TTL
- HTTPS everywhere
- Private S3 buckets with presigned URLs

### Financial Compliance
- Stripe handles KYC/KYB - no PAN storage
- EU VAT reverse-charge logic for B2B
- 10-year invoice retention
- Audit trail via Events table

### Rate Limiting & Abuse Prevention
- API rate limits: 100 requests/15 minutes
- Idempotency keys for financial operations
- Request ID tracking
- Webhook signature verification

## 🌍 Production Deployment

### Docker Deployment
```bash
# Backend
cd backend
docker build -t flowpay-backend .
docker run -p 3001:3001 flowpay-backend

# Database
docker run -d --name flowpay-db \
  -e POSTGRES_DB=flowpay \
  -e POSTGRES_USER=flowpay \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 postgres:14
```

### Environment Configuration
Set these in production:
- `NODE_ENV=production`
- Strong `JWT_SECRET` (32+ characters)
- Production Stripe keys
- Secure database credentials
- S3 bucket with proper IAM policies

### Monitoring
- Health check endpoint: `GET /health`
- Webhook success rates tracked
- P95 latency metrics
- Structured JSON logging

## 🔮 Future Roadmap

### V2 Features (Next 6 months)
- **Crypto Payouts:** USDC on Base/Polygon
- **Advanced Rights:** C2PA content provenance
- **AI Negotiation:** Automated deal terms
- **Marketplace:** Creator discovery platform

### Crypto Integration Prep
- `CryptoProvider` interface ready
- KYC compliance hooks
- Travel Rule provider integration planned
- Multi-chain wallet support designed

### Compliance Expansion
- MangoPay for European markets
- Additional KYC provider support
- Enhanced GDPR tooling
- SOC 2 Type II preparation

## 🤝 Contributing

### Development Process
1. Create feature branch from `main`
2. Run tests: `npm run test:all`
3. Lint code: `npm run lint:all` 
4. Create pull request
5. All checks must pass before merge

### Code Quality
- 90%+ test coverage required
- TypeScript strict mode
- ESLint + Prettier formatting
- Conventional commit messages

## 📞 Support

### Documentation
- API docs: `http://localhost:3001/docs`
- Architecture: `CLAUDE.md`
- Stripe integration: [Stripe Connect docs](https://stripe.com/docs/connect)

### Troubleshooting

**Database Connection Issues:**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset database
npm run db:reset
```

**Stripe Webhooks Not Received:**
```bash
# Check webhook endpoint is accessible
curl -X POST http://localhost:3001/webhooks/stripe \
  -H "stripe-signature: test" \
  -d "{}"

# Verify ngrok tunnel for local development
```

**Mobile App Won't Connect:**
- Ensure backend is running on correct port
- Check API_BASE_URL in app config
- Verify network permissions in simulator

---

**License:** MIT  
**Maintainer:** FlowPay Engineering Team  
**Version:** 1.0.0-beta