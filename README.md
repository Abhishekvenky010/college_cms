# College CMS with Solana MPC/TSS Integration

A comprehensive college content management system with blockchain integration using Solana Multi-Party Computation (MPC) and Threshold Signature Schemes (TSS) for secure transactions.

## 📁 Project Structure

This is a Turborepo monorepo with the following structure:

```
college_cms/
├── apps/
│   ├── backend/          # Express API server (port 3000)
│   ├── fe/              # Next.js frontend (port 4000)
│   ├── mpc_backend/     # MPC/TSS backend server (port 3001)
│   └── web/             # Next.js marketing/info site
├── packages/
│   ├── common/          # Shared utilities and types
│   ├── db/              # Prisma ORM for main database
│   ├── eslint-config/   # ESLint configurations
│   ├── mpc-db/          # Prisma ORM for MPC keyshare storage
│   ├── solana-mpc-tss/  # Solana MPC/TSS library
│   ├── typescript-config/ # TypeScript configurations
│   └── ui/              # React component library
└── package.json         # Root package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Bun package manager (v1.3.3)
- PostgreSQL databases (for main DB and MPC DB)

### Installation

```bash
# Install dependencies
bun install

# Build all apps and packages
bun run build

# Start development servers
bun run dev
```

### Services

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:4000
- **MPC Backend**: http://localhost:3001

## 📦 Apps

### Backend (Express API)

**Location**: [`apps/backend/`](apps/backend/)

RESTful API server built with Express.js, providing endpoints for:
- User authentication and management
- Course management
- Purchase tracking
- Solana wallet integration

Key Files:
- [`index.ts`](apps/backend/index.ts) - Server entry point
- [`routes/user.ts`](apps/backend/routes/user.ts) - User routes
- [`routes/admin.ts`](apps/backend/routes/admin.ts) - Admin routes
- [`middleware.ts`](apps/backend/middleware.ts) - Authentication middleware

### Frontend (Next.js)

**Location**: [`apps/fe/`](apps/fe/)

Student-facing application with:
- User authentication (sign in)
- Dashboard
- Course calendar
- Wallet management
- Purchase history

Key Files:
- [`app/page.tsx`](apps/fe/app/page.tsx) - Sign in page
- [`app/(sidebar)/dashboard/page.tsx`](apps/fe/app/(sidebar)/dashboard/page.tsx) - Dashboard
- [`app/(sidebar)/calendar/[courseId]/page.tsx`](apps/fe/app/(sidebar)/calendar/[courseId]/page.tsx) - Course calendar
- [`lib/api.ts`](apps/fe/lib/api.ts) - API client
- [`components/RequireAuth.tsx`](apps/fe/components/RequireAuth.tsx) - Authentication guard

### MPC Backend (Express API)

**Location**: [`apps/mpc_backend/`](apps/mpc_backend/)

MPC/TSS server for Solana transactions:
- User key generation
- Multi-party signing workflow
- Step 1 and Step 2 of aggregate signing
- Integration with Solana blockchain

Key Files:
- [`index.ts`](apps/mpc_backend/index.ts) - Server entry point with TSS operations

### Web (Next.js)

**Location**: [`apps/web/`](apps/web/)

Marketing and information website for the college CMS.

## 📦 Packages

### Common

**Location**: [`packages/common/`](packages/common/)

Shared utilities and types:
- Input validation schemas
- Solana-related constants
- Common interfaces

### DB (Prisma ORM)

**Location**: [`packages/db/`](packages/db/)

Main database schema with:
- User model (authentication, roles)
- Course model (course information)
- Purchases model (course purchases)

Key File:
- [`prisma/schema.prisma`](packages/db/prisma/schema.prisma) - Database schema

### MPC-DB (Prisma ORM)

**Location**: [`packages/mpc-db/`](packages/mpc-db/)

MPC keyshare storage:
- Keypair generation and storage
- User public/secret key management

Key File:
- [`prisma/schema.prisma`](packages/mpc-db/prisma/schema.prisma) - Keyshare schema

### Solana MPC/TSS Library

**Location**: [`packages/solana-mpc-tss/`](packages/solana-mpc-tss/)

Comprehensive TypeScript library for Solana MPC and TSS:
- Secure signing without private key exposure
- Threshold signature schemes (m-of-n)
- Solana integration with `Signer` interface
- WASM-optimized ed25519_tss_wasm with tweetnacl fallback
- ZenGo-X/solana-tss compatibility

Key Features:
- MPC signing operations
- TSS workflow support
- Solana transaction utilities
- Network support (mainnet-beta, devnet, testnet)

### UI (React Component Library)

**Location**: [`packages/ui/`](packages/ui/)

Reusable React components:
- Button
- Card
- Code block
- and more...

### Config Packages

- **eslint-config**: ESLint configurations
- **typescript-config**: TypeScript configurations

## 🔒 Authentication

The system uses JWT (JSON Web Tokens) for authentication:
- Users sign in with email and password
- Tokens are stored in localStorage
- Protected routes require valid tokens
- Roles: USER and ADMIN

## 📊 Database Schemas

### Main Database (PostgreSQL)

```prisma
// User model
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  phone     String    @unique
  password  String
  publicKey String?
  purchases Purchases[]
  role      Role      @default(USER)
}

// Course model
model Course {
  id                 String       @id @default(uuid())
  title              String
  slug               String       @unique
  purchase           Purchases[]
  calendarNotionId   String 
}

// Purchases model
model Purchases {
  id        String  @id @default(uuid())
  courseId  String
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  course    Course  @relation(fields: [courseId], references: [id])
  @@unique([userId, courseId])
}
```

### MPC Database (PostgreSQL)

```prisma
// Keyshare model
model keyshare {
  id         String    @id @default(uuid())
  userid     String    @unique
  publicKey  String
  secretKey  String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

## 🎯 Features

### Student Features

- User authentication
- Dashboard with course overview
- Course calendar (Notion integration)
- Wallet management (Solana)
- Purchase history
- Secure transactions using MPC/TSS

### Admin Features

- User management
- Course management
- Purchase tracking
- Analytics
- System configuration

## 🛠️ Development

### Scripts

```bash
# Build all apps and packages
bun run build

# Start development servers
bun run dev

# Lint all files
bun run lint

# Check types
bun run check-types

# Format files with Prettier
bun run format
```

### Filtering Tasks

```bash
# Build only the frontend
bun run build --filter=frontend

# Start only the backend
bun run dev --filter=backend
```

## 🚀 Deployment

This project uses Turborepo for efficient builds and caching. Deployment can be configured with:
- Vercel (for frontend apps)
- Docker (for backend services)
- Any cloud provider supporting Node.js and PostgreSQL

## 📚 Documentation

- **Solana MPC/TSS Library**: [`packages/solana-mpc-tss/README.md`](packages/solana-mpc-tss/README.md)
- **API Documentation**: TBD (Swagger/OpenAPI)
- **Developer Guide**: TBD

## 🔒 Security

- MPC/TSS ensures private keys never exist in plaintext
- Threshold signatures (configurable m-of-n)
- Network isolation for different Solana networks
- Automatic fallback from WASM to pure JavaScript
- Type safety with TypeScript

## 🤝 Contributing

Contributions are welcome! Please refer to the CONTRIBUTING.md file (TBD) for guidelines.

