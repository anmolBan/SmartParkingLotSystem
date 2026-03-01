# 🚗 Smart Parking Lot System

A robust, scalable backend API for managing multi-floor parking lots with support for different vehicle types, automated spot allocation, and concurrent operations.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Pricing Structure](#-pricing-structure)
- [Concurrency Handling](#-concurrency-handling)
- [Testing](#-testing)
- [Project Structure](#-project-structure)

## ✨ Features

- **Multi-floor Parking Management** - Support for multiple parking lots with configurable floors per vehicle type
- **Smart Spot Allocation** - Automatic floor-based allocation (Heavy vehicles → lowest floors, Bikes → top floors)
- **Vehicle Type Support** - BIKE, COMPACT, and LARGE vehicle categories
- **Automated Pricing** - Time-based fee calculation with per-vehicle-type hourly rates
- **Concurrency Safe** - Row-level locking prevents race conditions during simultaneous check-ins
- **JWT Authentication** - Secure admin routes with token-based authentication
- **Parking History** - Complete audit trail of all parking transactions
- **Input Validation** - Comprehensive request validation using Zod schemas

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework |
| **TypeScript** | Type-safe development |
| **PostgreSQL** | Database |
| **Prisma 7** | ORM with type-safe queries |
| **Zod 4** | Schema validation |
| **JWT** | Authentication |
| **Vitest** | Testing framework |

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Server                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    CORS     │  │    JSON     │  │   Route Handler     │  │
│  │  Middleware │  │   Parser    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  /api/v1/     │ │  /api/v1/     │ │   Zod         │
│    admin      │ │   parking     │ │  Validators   │
│   (Auth)      │ │  (Public)     │ │               │
└───────┬───────┘ └───────┬───────┘ └───────────────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Prisma ORM                                │
│         (Transactions, Row Locking, ACID)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                               │
└─────────────────────────────────────────────────────────────┘
```

### Floor Allocation Strategy

```
┌─────────────────────────────────────┐
│  Floor 5  │  🏍️ BIKE spots         │  ← Uppermost
├───────────┼─────────────────────────┤
│  Floor 4  │  🏍️ BIKE spots         │
├───────────┼─────────────────────────┤
│  Floor 3  │  🚗 COMPACT spots       │  ← Middle
├───────────┼─────────────────────────┤
│  Floor 2  │  🚗 COMPACT spots       │
├───────────┼─────────────────────────┤
│  Floor 1  │  🚛 LARGE/TRUCK spots   │  ← Lowest
└───────────┴─────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartParkingLotSystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/parking_db"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

   The server will start at `http://localhost:3000` with hot-reload enabled.

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

Protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Admin Routes

##### Sign In
```http
POST /api/v1/admin/signin
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Sign-in successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### Create Parking Lot (Protected)
```http
POST /api/v1/admin/createParkingLot
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Main Parking Complex",
  "location": "123 Downtown Street",
  "floorsReservedForTrucks": 1,
  "spotsPerFloorReservedForTrucks": 10,
  "floorsReservedForCompact": 2,
  "spotsPerFloorReservedForCompact": 20,
  "floorsReservedForBikes": 2,
  "spotsPerFloorReservedForBikes": 30
}
```

**Response:**
```json
{
  "message": "Parking lot created successfully",
  "parkingLot": {
    "id": 1,
    "name": "Main Parking Complex",
    "location": "123 Downtown Street"
  },
  "spotsCreated": {
    "large": 10,
    "compact": 40,
    "bike": 60,
    "total": 110
  },
  "totalFloors": 5
}
```

#### Parking Routes

##### Vehicle Check-In
```http
POST /api/v1/parking/checkin
```

**Request Body:**
```json
{
  "licensePlate": "MH-12-AB-1234",
  "vehicleType": "COMPACT"
}
```

**Vehicle Types:** `BIKE`, `COMPACT`, `LARGE`

**Response:**
```json
{
  "message": "Vehicle checked in successfully",
  "parkingFloor": 3,
  "parkingSpot": "COMPACT-3-5"
}
```

##### Vehicle Check-Out
```http
POST /api/v1/parking/checkout
```

**Request Body:**
```json
{
  "licensePlate": "MH-12-AB-1234"
}
```

**Response:**
```json
{
  "message": "Vehicle checked out successfully",
  "parkingFloor": 3,
  "parkingSpot": "COMPACT-3-5",
  "parkingFee": {
    "parkingFee": 150,
    "durationInHours": 3,
    "ratePerHour": 50
  }
}
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid input or business logic error |
| `401` | Unauthorized - Missing or invalid token |
| `500` | Internal Server Error |

**Example Error:**
```json
{
  "error": "No available parking spots for this vehicle type"
}
```

## 🗄 Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  type      UserType  // ADMIN | USER
}

model ParkingLot {
  id                              Int
  name                            String
  location                        String
  floorsReservedForTrucks         Int
  spotsPerFloorReservedForTrucks  Int
  floorsReservedForBikes          Int
  spotsPerFloorReservedForBikes   Int
  floorsReservedForCompact        Int
  spotsPerFloorReservedForCompact Int
  ParkingSpot                     ParkingSpot[]
}

model ParkingSpot {
  id          Int
  lotId       Int
  floor       Int
  spotNumber  String    // e.g., "COMPACT-3-5"
  spotType    SpotType  // BIKE | COMPACT | LARGE
  isOccupied  Boolean
  Vehicle     Vehicle?
}

model Vehicle {
  id            Int
  licensePlate  String   @unique
  vehicleType   SpotType
  checkInTime   DateTime
  parkingSpotId Int      @unique
}

model ParkingHistory {
  id                Int
  licensePlate      String
  vehicleType       SpotType
  checkInTime       DateTime
  checkOutTime      DateTime
  parkingFee        Float
  parkingSpotNumber String
}
```

## 💰 Pricing Structure

| Vehicle Type | Hourly Rate (₹) |
|--------------|-----------------|
| 🏍️ BIKE     | ₹30/hour        |
| 🚗 COMPACT   | ₹50/hour        |
| 🚛 LARGE     | ₹200/hour       |

**Note:** Duration is rounded up to the nearest hour.

**Example:**
- COMPACT car parked for 2 hours 15 minutes = 3 hours × ₹50 = **₹150**

## 🔒 Concurrency Handling

The system uses PostgreSQL row-level locking to handle simultaneous check-ins safely:

### Check-In Flow
```sql
SELECT id, floor, "spotNumber"
FROM "ParkingSpot"
WHERE "spotType" = 'COMPACT'
AND "isOccupied" = false
ORDER BY id ASC
LIMIT 1
FOR UPDATE SKIP LOCKED  -- Key: Skip already-locked rows
```

### How It Works

```
10 vehicles checking in simultaneously for COMPACT spots:

Vehicle 1: SELECT ... FOR UPDATE SKIP LOCKED → gets spot #1, locks it
Vehicle 2: SELECT ... FOR UPDATE SKIP LOCKED → spot #1 locked, gets spot #2
Vehicle 3: SELECT ... FOR UPDATE SKIP LOCKED → spots #1,#2 locked, gets spot #3
...
All 10 vehicles get unique spots ✅
```

### Transaction Settings
- **Isolation Level:** `Serializable` (highest level)
- **Timeout:** 10 seconds (prevents deadlocks)

## 🧪 Testing

The project includes a comprehensive test suite with **69 tests** covering:

| Test Category | Tests | Coverage |
|---------------|-------|----------|
| Pricing Logic | 16 | Hourly rates, duration, fee calculation |
| Validators | 18 | All Zod schema validations |
| Auth Middleware | 5 | JWT verification, token expiry |
| Spot Generation | 8 | Floor allocation logic |
| Admin Routes | 9 | Sign-in, create parking lot |
| Parking Routes | 9 | Check-in, checkout flow |
| Concurrency | 4 | Documentation tests |

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

### Test Output Example
```
✓ src/__tests__/pricing.test.ts (16 tests)
✓ src/__tests__/validators.test.ts (18 tests)
✓ src/__tests__/auth.test.ts (5 tests)
✓ src/__tests__/spotGeneration.test.ts (8 tests)
✓ src/__tests__/routes/admin.test.ts (9 tests)
✓ src/__tests__/routes/parking.test.ts (9 tests)
✓ src/__tests__/concurrency.test.ts (4 tests)

Test Files  7 passed (7)
     Tests  69 passed (69)
```

## 📁 Project Structure

```
SmartParkingLotSystem/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── __tests__/             # Test files
│   │   ├── mocks/             # Test mocks
│   │   ├── routes/            # Route integration tests
│   │   ├── auth.test.ts       # Auth middleware tests
│   │   ├── pricing.test.ts    # Pricing logic tests
│   │   ├── validators.test.ts # Validation tests
│   │   └── ...
│   ├── generated/
│   │   └── prisma/            # Prisma generated client
│   ├── lib/
│   │   ├── pricing.ts         # Fee calculation logic
│   │   └── prisma.ts          # Prisma client instance
│   ├── middlewares/
│   │   └── auth.ts            # JWT authentication
│   ├── routes/
│   │   ├── admin/             # Admin endpoints
│   │   ├── parking/           # Parking endpoints
│   │   ├── v1/                # API version 1 router
│   │   └── index.ts           # Main router
│   ├── types/
│   │   └── express.d.ts       # Express type extensions
│   ├── validators/
│   │   ├── parkingSchema.ts   # Parking-related schemas
│   │   └── userSchemas.ts     # User-related schemas
│   ├── app.ts                 # Express app (for testing)
│   └── index.ts               # Server entry point
├── .env                       # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── vitest.config.ts           # Test configuration
```

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
