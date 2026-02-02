# Khao Peeo - Restaurant Management System
## System Design & Architecture Document

**Version:** 1.0  
**Last Updated:** January 30, 2026  
**Document Type:** Technical Design Document (TDD) / Software Requirements Specification (SRS)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [User Roles & Permissions](#user-roles--permissions)
7. [API Endpoints](#api-endpoints)
8. [Authentication & Authorization](#authentication--authorization)
9. [Frontend Architecture](#frontend-architecture)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [Security Considerations](#security-considerations)
12. [Deployment Architecture](#deployment-architecture)
13. [Feature Specifications](#feature-specifications)

---

## Executive Summary

**Khao Peeo** is a comprehensive restaurant management system built using the MERN stack (MongoDB, Express.js, React, Node.js). The system provides end-to-end management of restaurant operations including table management, order processing, kitchen operations, billing, and user administration.

### Key Capabilities

- **Multi-role Access Control**: SuperAdmin, Owner, Admin, and Waiter roles with granular permissions
- **Real-time User Tracking**: Online/offline status monitoring and activity tracking
- **Complete Order Lifecycle**: From order creation to kitchen processing to billing
- **Table Management**: Dynamic table booking and status management
- **Kitchen Display System**: Real-time order tracking for kitchen staff
- **Bill Generation**: KOT (Kitchen Order Ticket) and final bill generation
- **Historical Order Tracking**: Served orders archive with reprint capabilities
- **User Management**: Comprehensive CRUD operations for user administration

---

## System Overview

### What It Does

Khao Peeo is a full-stack restaurant management platform that digitizes and streamlines restaurant operations:

1. **Order Management**: Waiters can create orders for tables, track order status through the kitchen workflow
2. **Table Management**: Monitor table occupancy, booking status, and current orders
3. **Kitchen Operations**: Kitchen staff view pending orders, update preparation status
4. **Billing System**: Generate itemized bills with tax calculations
5. **User Administration**: SuperAdmin can manage all system users with role-based access
6. **Analytics**: Track served orders, revenue, and operational metrics

### How It Works

```mermaid
graph TB
    A[Customer Arrives] --> B[Waiter Assigns Table]
    B --> C[Waiter Creates Order]
    C --> D[Order Sent to Kitchen]
    D --> E[Kitchen Updates Status]
    E --> F{Order Ready?}
    F -->|No| E
    F -->|Yes| G[Waiter Serves Food]
    G --> H[Generate Bill]
    H --> I[Customer Pays]
    I --> J[Archive Served Order]
    J --> K[Reset Table]
```

### Target Users

- **Restaurant Owners**: Monitor operations, manage staff, view analytics
- **Restaurant Managers/Admins**: Handle day-to-day operations, manage orders and bills
- **Waiters**: Take orders, serve customers, manage tables
- **Kitchen Staff**: View and update order preparation status
- **SuperAdmins**: System administrators with full access

---

## Architecture

### High-Level Architecture

```mermaid
graph LR
    subgraph Frontend
        A[React SPA]
        B[React Router]
        C[TanStack Query]
        D[Axios Client]
    end
    
    subgraph Backend
        E[Express Server]
        F[JWT Middleware]
        G[Role Middleware]
        H[Controllers]
        I[Models]
    end
    
    subgraph Database
        J[(MongoDB)]
    end
    
    A --> B
    B --> C
    C --> D
    D -->|HTTP/REST| E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
```

### System Architecture Diagram

```mermaid
graph TB
    subgraph Client Layer
        UI[React Frontend<br/>Vite + TypeScript]
        Router[React Router<br/>Client-side Routing]
        State[TanStack Query<br/>State Management]
    end
    
    subgraph API Layer
        Gateway[Express Server<br/>Port 5000]
        Auth[Auth Middleware<br/>JWT Verification]
        RBAC[Role Middleware<br/>Permission Check]
    end
    
    subgraph Business Logic
        AuthC[Auth Controller]
        OrderC[Order Controller]
        TableC[Table Controller]
        BillC[Bill Controller]
        AdminC[SuperAdmin Controller]
        ServedC[Served Order Controller]
    end
    
    subgraph Data Layer
        UserM[User Model]
        OrderM[Order Model]
        TableM[Table Model]
        BillM[Bill Model]
        ServedM[Served Order Model]
    end
    
    subgraph Database
        DB[(MongoDB<br/>NoSQL Database)]
    end
    
    UI --> Router
    Router --> State
    State -->|API Calls| Gateway
    Gateway --> Auth
    Auth --> RBAC
    RBAC --> AuthC
    RBAC --> OrderC
    RBAC --> TableC
    RBAC --> BillC
    RBAC --> AdminC
    RBAC --> ServedC
    
    AuthC --> UserM
    OrderC --> OrderM
    TableC --> TableM
    BillC --> BillM
    AdminC --> UserM
    ServedC --> ServedM
    
    UserM --> DB
    OrderM --> DB
    TableM --> DB
    BillM --> DB
    ServedM --> DB
```

### Component Architecture

```mermaid
graph TB
    subgraph Frontend Components
        Pages[Pages Layer]
        Components[Reusable Components]
        API[API Integration Layer]
        Hooks[Custom Hooks]
    end
    
    subgraph Backend Modules
        Routes[Route Handlers]
        Controllers[Business Logic]
        Middleware[Auth & RBAC]
        Models[Data Models]
        Utils[Utilities]
    end
    
    Pages --> Components
    Pages --> API
    Pages --> Hooks
    API --> Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Models
    Controllers --> Utils
```

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest | JavaScript runtime environment |
| **Express.js** | ^4.19.2 | Web application framework |
| **MongoDB** | ^8.5.1 (Mongoose) | NoSQL database |
| **JWT** | ^9.0.2 | Authentication tokens |
| **bcryptjs** | ^2.4.3 | Password hashing |
| **CORS** | ^2.8.5 | Cross-origin resource sharing |
| **Morgan** | ^1.10.0 | HTTP request logger |
| **dotenv** | ^16.4.5 | Environment variable management |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.3.1 | UI library |
| **TypeScript** | ^5.8.3 | Type-safe JavaScript |
| **Vite** | ^5.4.19 | Build tool and dev server |
| **React Router** | ^6.30.1 | Client-side routing |
| **TanStack Query** | ^5.83.0 | Server state management |
| **Axios** | ^1.7.9 | HTTP client |
| **Tailwind CSS** | ^3.4.17 | Utility-first CSS framework |
| **Shadcn/UI** | Latest | Component library (Radix UI) |
| **Framer Motion** | ^12.23.26 | Animation library |
| **Lucide React** | ^0.462.0 | Icon library |
| **React Hook Form** | ^7.61.1 | Form management |
| **Zod** | ^3.25.76 | Schema validation |
| **date-fns** | ^3.6.0 | Date manipulation |
| **Recharts** | ^2.15.4 | Data visualization |

### Development Tools

- **Nodemon**: Auto-restart development server
- **ESLint**: Code linting
- **TypeScript ESLint**: TypeScript-specific linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ORDER : creates
    USER ||--o{ SERVED_ORDER : serves
    TABLE ||--o{ ORDER : has
    TABLE ||--o{ SERVED_ORDER : belongs_to
    ORDER ||--o| BILL : generates
    ORDER ||--o{ ORDER_ITEM : contains
    SERVED_ORDER ||--o{ SERVED_ORDER_DETAIL : contains
    SERVED_ORDER_DETAIL ||--o{ SERVED_ORDER_ITEM : contains
    
    USER {
        ObjectId _id PK
        String fullName
        String email UK
        String password
        String role
        Boolean isOnline
        Date lastLogin
        Date lastActivity
        Date createdAt
        Date updatedAt
    }
    
    TABLE {
        ObjectId _id PK
        Number tableNumber UK
        Number capacity
        Boolean isBooked
        ObjectId currentOrder FK
        Date createdAt
        Date updatedAt
    }
    
    ORDER {
        ObjectId _id PK
        ObjectId table FK
        Array items
        Number totalAmount
        String status
        ObjectId createdBy FK
        Date createdAt
        Date updatedAt
    }
    
    ORDER_ITEM {
        String item_name
        Number quantity
        Number price
    }
    
    BILL {
        ObjectId _id PK
        ObjectId order FK
        ObjectId table FK
        Number subtotal
        Number tax
        Number totalAmount
        String paymentStatus
        Date createdAt
        Date updatedAt
    }
    
    SERVED_ORDER {
        ObjectId _id PK
        Number tableNumber
        Array orders
        Number totalBillAmount
        Mixed billDetails
        Date servedAt
        ObjectId servedBy FK
        Date createdAt
        Date updatedAt
    }
    
    SERVED_ORDER_DETAIL {
        String orderId
        Array items
        Number totalAmount
        String status
        Date createdAt
        Date updatedAt
    }
    
    SERVED_ORDER_ITEM {
        String item_name
        Number quantity
        Number price
    }
```

### Collection Details

#### 1. Users Collection

**Purpose**: Store user accounts with role-based access control

```javascript
{
  _id: ObjectId,
  fullName: String (required, trimmed),
  email: String (required, unique, lowercase, trimmed),
  password: String (required, hashed, min 6 chars),
  role: String (enum: ["owner", "admin", "waiter", "superadmin"], default: "admin"),
  isOnline: Boolean (default: false),
  lastLogin: Date,
  lastActivity: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**: 
- `email` (unique)

**Features**:
- Password hashing with bcrypt
- Real-time online status tracking
- Last activity timestamp for session management

---

#### 2. Tables Collection

**Purpose**: Manage restaurant tables and their booking status

```javascript
{
  _id: ObjectId,
  tableNumber: Number (required, unique),
  capacity: Number (required, default: 4),
  isBooked: Boolean (default: false),
  currentOrder: ObjectId (ref: "Order", nullable),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `tableNumber` (unique)

**Features**:
- Dynamic capacity management
- Booking status tracking
- Reference to active order

---

#### 3. Orders Collection

**Purpose**: Track customer orders through the kitchen workflow

```javascript
{
  _id: ObjectId,
  table: ObjectId (ref: "Table", required),
  items: [
    {
      item_name: String (required),
      quantity: Number (required),
      price: Number (required)
    }
  ],
  totalAmount: Number (required),
  status: String (enum: ["pending", "sent_to_kitchen", "preparing", "ready", "served"], default: "sent_to_kitchen"),
  createdBy: ObjectId (ref: "User", required),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `table` (for quick table-based queries)
- `status` (for kitchen display filtering)

**Status Flow**:
1. `pending` → Order created but not sent
2. `sent_to_kitchen` → Order submitted to kitchen
3. `preparing` → Kitchen is preparing the order
4. `ready` → Order ready for serving
5. `served` → Order delivered to customer

---

#### 4. Bills Collection

**Purpose**: Generate bills for orders with tax calculations

```javascript
{
  _id: ObjectId,
  order: ObjectId (ref: "Order", required),
  table: ObjectId (ref: "Table", required),
  subtotal: Number (required),
  tax: Number (required),
  totalAmount: Number (required),
  paymentStatus: String (enum: ["pending", "paid"], default: "pending"),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Features**:
- Automatic tax calculation
- Payment status tracking
- Links to order and table for reference

---

#### 5. Served Orders Collection

**Purpose**: Archive completed orders for historical tracking and reprinting

```javascript
{
  _id: ObjectId,
  tableNumber: Number (required, indexed),
  orders: [
    {
      orderId: String (required),
      items: [
        {
          item_name: String (required),
          quantity: Number (required),
          price: Number (required)
        }
      ],
      totalAmount: Number (required),
      status: String (required),
      createdAt: Date (required),
      updatedAt: Date (required)
    }
  ],
  totalBillAmount: Number (required),
  billDetails: Mixed (complete bill data for reprinting),
  servedAt: Date (default: now, indexed),
  servedBy: ObjectId (ref: "User", required),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `tableNumber` (single)
- `servedAt` (single, descending)
- `{tableNumber: 1, servedAt: -1}` (compound for efficient queries)

**Features**:
- Stores complete order history
- Enables bill reprinting
- Supports analytics and reporting

---

## User Roles & Permissions

### Role Hierarchy

```mermaid
graph TD
    SA[SuperAdmin<br/>Full System Access] --> O[Owner<br/>Business Operations]
    O --> A[Admin<br/>Daily Operations]
    A --> W[Waiter<br/>Order Management]
```

### Permission Matrix

| Feature | SuperAdmin | Owner | Admin | Waiter |
|---------|-----------|-------|-------|--------|
| **User Management** |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Update Users | ✅ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |
| View All Users | ✅ | ❌ | ❌ | ❌ |
| View User Stats | ✅ | ❌ | ❌ | ❌ |
| Toggle User Status | ✅ | ❌ | ❌ | ❌ |
| **Table Management** |
| Create Tables | ✅ | ✅ | ❌ | ❌ |
| View Tables | ✅ | ✅ | ✅ | ✅ |
| Update Table Status | ✅ | ✅ | ✅ | ❌ |
| Reset Tables | ✅ | ✅ | ✅ | ✅ |
| **Order Management** |
| Create Orders | ✅ | ✅ | ✅ | ✅ |
| View All Orders | ✅ | ✅ | ✅ | ✅ |
| Update Order Status | ✅ | ✅ | ✅ | ✅ |
| View Orders by Table | ✅ | ✅ | ✅ | ✅ |
| **Bill Management** |
| Create KOT Receipt | ✅ | ✅ | ✅ | ❌ |
| Create Final Bill | ✅ | ✅ | ✅ | ❌ |
| View All Bills | ✅ | ✅ | ✅ | ❌ |
| View Bill by Order | ✅ | ✅ | ✅ | ✅ |
| **Served Orders** |
| View Served Orders | ✅ | ✅ | ✅ | ❌ |
| View Served Order Details | ✅ | ✅ | ✅ | ❌ |
| Reprint Bills | ✅ | ✅ | ✅ | ❌ |
| **Authentication** |
| Login | ✅ | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ | ✅ |
| Register | ❌ | ❌ | ❌ | ❌ |

### Role Descriptions

#### SuperAdmin
- **Purpose**: System administration and user management
- **Access**: Full system access, cannot be restricted
- **Capabilities**:
  - Create, update, delete any user
  - View all system statistics
  - Monitor online users
  - Access all features of other roles
  - Manage user permissions

#### Owner
- **Purpose**: Business owner with operational oversight
- **Access**: All operational features except user management
- **Capabilities**:
  - Create and manage tables
  - View all orders and bills
  - Access analytics and reports
  - Manage daily operations

#### Admin
- **Purpose**: Restaurant manager handling day-to-day operations
- **Access**: Order processing, billing, and table management
- **Capabilities**:
  - Process orders from creation to billing
  - Generate KOT receipts and final bills
  - Update table status
  - View served order history

#### Waiter
- **Purpose**: Front-line staff taking orders and serving customers
- **Access**: Limited to order creation and table management
- **Capabilities**:
  - Create customer orders
  - Update order status
  - Reset tables after service
  - View orders for assigned tables

---

## API Endpoints

### Base URL
```
Development: http://localhost:5000/api
Production: <DEPLOYMENT_URL>/api
```

### Authentication Endpoints

#### POST `/auth/register`
**Description**: Register a new user (currently disabled in production)

**Request Body**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "isOnline": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### POST `/auth/login`
**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "isOnline": true,
    "lastLogin": "2026-01-30T06:10:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `401`: Invalid credentials
- `404`: User not found

---

#### POST `/auth/logout`
**Description**: Logout user and update online status

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Table Management Endpoints

#### GET `/tables`
**Description**: Get all tables with their current status

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin, waiter

**Response** (200):
```json
{
  "success": true,
  "tables": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "tableNumber": 1,
      "capacity": 4,
      "isBooked": true,
      "currentOrder": "65f1a2b3c4d5e6f7g8h9i0j2",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-30T06:10:00.000Z"
    }
  ]
}
```

---

#### GET `/tables/:id`
**Description**: Get specific table by ID

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin, waiter

**Response** (200):
```json
{
  "success": true,
  "table": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "tableNumber": 1,
    "capacity": 4,
    "isBooked": true,
    "currentOrder": {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j2",
      "items": [...],
      "totalAmount": 450,
      "status": "preparing"
    }
  }
}
```

---

#### POST `/tables`
**Description**: Create a new table

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner

**Request Body**:
```json
{
  "tableNumber": 5,
  "capacity": 6
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Table created successfully",
  "table": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "tableNumber": 5,
    "capacity": 6,
    "isBooked": false,
    "currentOrder": null
  }
}
```

---

#### PUT `/tables/:id/status`
**Description**: Update table booking status

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin

**Request Body**:
```json
{
  "isBooked": true
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Table status updated",
  "table": { ... }
}
```

---

#### PUT `/tables/:id/reset`
**Description**: Reset table (clear booking and current order)

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin, waiter

**Response** (200):
```json
{
  "success": true,
  "message": "Table reset successfully",
  "table": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "tableNumber": 1,
    "isBooked": false,
    "currentOrder": null
  }
}
```

---

### Order Management Endpoints

#### GET `/orders`
**Description**: Get all orders

**Headers**: `Authorization: Bearer <token>`

**Permissions**: All authenticated users

**Query Parameters**:
- `status` (optional): Filter by order status

**Response** (200):
```json
{
  "success": true,
  "orders": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j2",
      "table": {
        "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
        "tableNumber": 1
      },
      "items": [
        {
          "item_name": "Butter Chicken",
          "quantity": 2,
          "price": 350
        },
        {
          "item_name": "Naan",
          "quantity": 4,
          "price": 40
        }
      ],
      "totalAmount": 860,
      "status": "preparing",
      "createdBy": {
        "_id": "65f1a2b3c4d5e6f7g8h9i0j3",
        "fullName": "John Doe"
      },
      "createdAt": "2026-01-30T06:00:00.000Z",
      "updatedAt": "2026-01-30T06:15:00.000Z"
    }
  ]
}
```

---

#### POST `/orders`
**Description**: Create a new order

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin, waiter

**Request Body**:
```json
{
  "tableId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "items": [
    {
      "item_name": "Butter Chicken",
      "quantity": 2,
      "price": 350
    },
    {
      "item_name": "Naan",
      "quantity": 4,
      "price": 40
    }
  ],
  "totalAmount": 860
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j2",
    "table": "65f1a2b3c4d5e6f7g8h9i0j1",
    "items": [...],
    "totalAmount": 860,
    "status": "sent_to_kitchen",
    "createdBy": "65f1a2b3c4d5e6f7g8h9i0j3"
  }
}
```

---

#### GET `/orders/table/:tableId`
**Description**: Get all orders for a specific table

**Headers**: `Authorization: Bearer <token>`

**Permissions**: All authenticated users

**Response** (200):
```json
{
  "success": true,
  "orders": [...]
}
```

---

#### PATCH `/orders/:id/status`
**Description**: Update order status

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin, waiter

**Request Body**:
```json
{
  "status": "ready"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Order status updated",
  "order": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j2",
    "status": "ready",
    "updatedAt": "2026-01-30T06:20:00.000Z"
  }
}
```

---

### Bill Management Endpoints

#### GET `/bills`
**Description**: Get all bills

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin

**Response** (200):
```json
{
  "success": true,
  "bills": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j4",
      "order": {...},
      "table": {...},
      "subtotal": 860,
      "tax": 154.8,
      "totalAmount": 1014.8,
      "paymentStatus": "paid",
      "createdAt": "2026-01-30T06:30:00.000Z"
    }
  ]
}
```

---

#### POST `/bills`
**Description**: Create KOT (Kitchen Order Ticket) receipt

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin

**Request Body**:
```json
{
  "orderId": "65f1a2b3c4d5e6f7g8h9i0j2",
  "tableId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "KOT receipt generated",
  "bill": {...}
}
```

---

#### POST `/bills/final/:tableId`
**Description**: Generate final bill for a table (consolidates all orders)

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin

**Response** (201):
```json
{
  "success": true,
  "message": "Final bill generated",
  "bill": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j4",
    "order": "65f1a2b3c4d5e6f7g8h9i0j2",
    "table": "65f1a2b3c4d5e6f7g8h9i0j1",
    "subtotal": 860,
    "tax": 154.8,
    "totalAmount": 1014.8,
    "paymentStatus": "pending"
  }
}
```

---

#### GET `/bills/order/:orderId`
**Description**: Get bill for a specific order

**Headers**: `Authorization: Bearer <token>`

**Permissions**: All authenticated users

**Response** (200):
```json
{
  "success": true,
  "bill": {...}
}
```

---

### SuperAdmin Endpoints

#### GET `/superadmin/users`
**Description**: Get all users in the system

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**Response** (200):
```json
{
  "success": true,
  "users": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j3",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "isOnline": true,
      "lastLogin": "2026-01-30T06:00:00.000Z",
      "lastActivity": "2026-01-30T06:30:00.000Z",
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### GET `/superadmin/users/stats`
**Description**: Get user statistics

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**Response** (200):
```json
{
  "success": true,
  "stats": {
    "total": 25,
    "byRole": {
      "owner": 2,
      "admin": 8,
      "waiter": 14,
      "superadmin": 1
    },
    "online": 12,
    "offline": 13
  }
}
```

---

#### GET `/superadmin/users/recent`
**Description**: Get recently registered users

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**Query Parameters**:
- `limit` (optional, default: 10): Number of users to return

**Response** (200):
```json
{
  "success": true,
  "users": [...]
}
```

---

#### GET `/superadmin/users/online`
**Description**: Get currently online users

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**Response** (200):
```json
{
  "success": true,
  "onlineUsers": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j3",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "lastActivity": "2026-01-30T06:30:00.000Z"
    }
  ]
}
```

---

#### GET `/superadmin/users/role/:role`
**Description**: Get users by role

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**URL Parameters**:
- `role`: One of ["owner", "admin", "waiter", "superadmin"]

**Response** (200):
```json
{
  "success": true,
  "users": [...]
}
```

---

#### POST `/superadmin/users`
**Description**: Create a new user

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**Request Body**:
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "waiter"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j5",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "role": "waiter",
    "isOnline": false
  }
}
```

---

#### PUT `/superadmin/users/:id`
**Description**: Update user details

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "role": "admin"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {...}
}
```

---

#### DELETE `/superadmin/users/:id`
**Description**: Delete a user

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**Response** (200):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

#### PATCH `/superadmin/users/:id/toggle-status`
**Description**: Toggle user active/inactive status

**Headers**: `Authorization: Bearer <token>`

**Permissions**: superadmin

**Response** (200):
```json
{
  "success": true,
  "message": "User status toggled",
  "user": {...}
}
```

---

### Served Orders Endpoints

#### GET `/served-orders`
**Description**: Get all served orders (historical data)

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin, superadmin

**Query Parameters**:
- `tableNumber` (optional): Filter by table number
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `limit` (optional, default: 50): Number of records
- `page` (optional, default: 1): Page number

**Response** (200):
```json
{
  "success": true,
  "servedOrders": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j6",
      "tableNumber": 1,
      "orders": [
        {
          "orderId": "65f1a2b3c4d5e6f7g8h9i0j2",
          "items": [...],
          "totalAmount": 860,
          "status": "served",
          "createdAt": "2026-01-30T06:00:00.000Z",
          "updatedAt": "2026-01-30T06:30:00.000Z"
        }
      ],
      "totalBillAmount": 1014.8,
      "billDetails": {...},
      "servedAt": "2026-01-30T06:35:00.000Z",
      "servedBy": {
        "_id": "65f1a2b3c4d5e6f7g8h9i0j3",
        "fullName": "John Doe"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 234
  }
}
```

---

#### GET `/served-orders/:id`
**Description**: Get specific served order by ID

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin, superadmin

**Response** (200):
```json
{
  "success": true,
  "servedOrder": {...}
}
```

---

#### GET `/served-orders/:id/bill`
**Description**: Get bill details for reprinting

**Headers**: `Authorization: Bearer <token>`

**Permissions**: owner, admin, superadmin

**Response** (200):
```json
{
  "success": true,
  "bill": {
    "tableNumber": 1,
    "items": [...],
    "subtotal": 860,
    "tax": 154.8,
    "totalAmount": 1014.8,
    "servedAt": "2026-01-30T06:35:00.000Z",
    "servedBy": "John Doe"
  }
}
```

---

### Health Check Endpoint

#### GET `/health`
**Description**: Check if backend server is running

**Response** (200):
```json
{
  "status": "ok",
  "message": "Khao Peeo backend running"
}
```

---

## Authentication & Authorization

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant M as Auth Middleware
    participant DB as Database
    
    C->>S: POST /auth/login<br/>{email, password}
    S->>DB: Find user by email
    DB-->>S: User data
    S->>S: Compare password hash
    S->>S: Generate JWT token
    S->>DB: Update isOnline, lastLogin
    S-->>C: {user, token}
    
    Note over C: Store token in localStorage
    
    C->>S: GET /orders<br/>Authorization: Bearer <token>
    S->>M: Verify JWT
    M->>M: Decode token
    M->>DB: Find user by ID
    DB-->>M: User data
    M->>M: Attach user to request
    M-->>S: Continue to route
    S-->>C: {orders: [...]}
```

### JWT Token Structure

**Payload**:
```json
{
  "id": "65f1a2b3c4d5e6f7g8h9i0j3",
  "iat": 1738220400,
  "exp": 1738306800
}
```

**Token Expiration**: 24 hours (configurable via environment variable)

**Storage**: Client-side in `localStorage`

---

### Authorization Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant AM as Auth Middleware
    participant RM as Role Middleware
    participant H as Route Handler
    
    C->>AM: Request with JWT
    AM->>AM: Verify token
    AM->>AM: Attach user to request
    AM->>RM: Forward request
    RM->>RM: Check user.role
    alt Role authorized
        RM->>H: Forward request
        H-->>C: Success response
    else Role not authorized
        RM-->>C: 403 Forbidden
    end
```

### Security Measures

1. **Password Security**
   - Passwords hashed using bcryptjs (10 salt rounds)
   - Minimum 6 characters required
   - Never stored or transmitted in plain text

2. **JWT Security**
   - Signed with secret key (stored in environment variables)
   - Includes expiration time
   - Verified on every protected route

3. **CORS Configuration**
   - Whitelist of allowed origins
   - Credentials support enabled
   - Development mode allows all origins

4. **Input Validation**
   - Email format validation
   - Required field validation
   - Type checking on all inputs

5. **Error Handling**
   - Generic error messages to prevent information leakage
   - Detailed logging server-side only
   - 401 for authentication failures
   - 403 for authorization failures

---

## Frontend Architecture

### Application Structure

```
frontend/
├── src/
│   ├── api/              # API integration layer
│   │   ├── client.ts     # Axios instance with interceptors
│   │   ├── auth.ts       # Authentication API calls
│   │   ├── tables.ts     # Table management API
│   │   ├── orders.ts     # Order management API
│   │   ├── bills.ts      # Billing API
│   │   ├── superadmin.ts # SuperAdmin API
│   │   └── servedOrders.ts # Served orders API
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Shadcn/UI components
│   │   ├── KOTReceipt.tsx
│   │   ├── BillReceipt.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Route pages
│   │   ├── Index.tsx     # Landing page
│   │   ├── Auth.tsx      # Login/Register
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── OwnerDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── WaiterDashboard.tsx
│   │   └── KitchenDisplay.tsx
│   ├── lib/              # Utilities
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json
```

### Routing Structure

```mermaid
graph TD
    Root["/"] --> Index[Index Page<br/>Landing]
    Root --> Auth["/auth"<br/>Login/Register]
    Root --> About["/about"<br/>About Page]
    Root --> Contact["/contact"<br/>Contact Page]
    
    Auth -->|SuperAdmin| SAD["/superadmin-dashboard"<br/>User Management]
    Auth -->|Owner| OD["/owner-dashboard"<br/>Operations Overview]
    Auth -->|Admin| AD["/admin-dashboard"<br/>Order & Bill Management]
    Auth -->|Waiter| WD["/waiter-dashboard"<br/>Table & Order Management]
    
    AD --> KD["/kitchen-display"<br/>Kitchen View]
    
    Root --> NF["/\*"<br/>404 Not Found]
```

### State Management

**TanStack Query** is used for server state management:

- **Queries**: Fetch and cache data (tables, orders, bills, users)
- **Mutations**: Create, update, delete operations
- **Automatic Refetching**: On window focus, network reconnect
- **Optimistic Updates**: Immediate UI updates before server confirmation

**Local State**:
- User authentication state (localStorage)
- Form state (React Hook Form)
- UI state (React useState)

### API Client Configuration

```typescript
// Axios instance with interceptors
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: Add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
```

---

## Data Flow Diagrams

### Order Creation Flow

```mermaid
sequenceDiagram
    participant W as Waiter
    participant UI as Frontend
    participant API as Backend API
    participant DB as MongoDB
    
    W->>UI: Select table & add items
    UI->>UI: Calculate total amount
    W->>UI: Submit order
    UI->>API: POST /api/orders<br/>{tableId, items, totalAmount}
    API->>API: Verify JWT & role
    API->>DB: Create order document
    API->>DB: Update table.currentOrder
    API->>DB: Set table.isBooked = true
    DB-->>API: Order created
    API-->>UI: {success, order}
    UI->>UI: Update UI with new order
    UI->>UI: Navigate to orders list
    
    Note over UI,DB: Order now visible in Kitchen Display
```

---

### Bill Generation Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant UI as Frontend
    participant API as Backend API
    participant DB as MongoDB
    
    A->>UI: Request final bill for table
    UI->>API: POST /api/bills/final/:tableId
    API->>API: Verify JWT & role (admin/owner)
    API->>DB: Find all orders for table
    DB-->>API: Orders array
    API->>API: Calculate subtotal
    API->>API: Calculate tax (18%)
    API->>API: Calculate total
    API->>DB: Create bill document
    API->>DB: Update order status to "served"
    API->>DB: Create served order archive
    API->>DB: Reset table (isBooked=false, currentOrder=null)
    DB-->>API: Bill created
    API-->>UI: {success, bill}
    UI->>UI: Display bill receipt
    UI->>UI: Enable print option
```

---

### User Management Flow (SuperAdmin)

```mermaid
sequenceDiagram
    participant SA as SuperAdmin
    participant UI as Frontend
    participant API as Backend API
    participant DB as MongoDB
    
    SA->>UI: Access SuperAdmin Dashboard
    UI->>API: GET /api/superadmin/users
    API->>API: Verify JWT
    API->>API: Check role = superadmin
    API->>DB: Find all users
    DB-->>API: Users array
    API-->>UI: {success, users}
    UI->>UI: Display users table
    
    SA->>UI: Click "Add User"
    UI->>UI: Show user form
    SA->>UI: Fill form & submit
    UI->>API: POST /api/superadmin/users<br/>{fullName, email, password, role}
    API->>API: Hash password
    API->>DB: Create user document
    DB-->>API: User created
    API-->>UI: {success, user}
    UI->>UI: Refresh users list
    UI->>UI: Show success toast
```

---

### Real-time Online Status Tracking

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as Backend API
    participant DB as MongoDB
    
    U->>UI: Login
    UI->>API: POST /api/auth/login
    API->>DB: Update user.isOnline = true
    API->>DB: Set user.lastLogin = now
    DB-->>API: User updated
    API-->>UI: {user, token}
    
    loop Every 5 minutes (activity tracking)
        UI->>API: Any API call
        API->>DB: Update user.lastActivity = now
    end
    
    U->>UI: Logout
    UI->>API: POST /api/auth/logout
    API->>DB: Update user.isOnline = false
    DB-->>API: User updated
    API-->>UI: {success}
    
    Note over UI,DB: SuperAdmin can view online users in real-time
```

---

## Security Considerations

### 1. Authentication Security

- **JWT Tokens**: 
  - Signed with strong secret key (minimum 32 characters)
  - Expiration time enforced (24 hours)
  - Stored in localStorage (consider httpOnly cookies for production)

- **Password Security**:
  - Bcrypt hashing with 10 salt rounds
  - Minimum 6 character requirement (recommend 8+ for production)
  - Passwords never logged or transmitted in plain text

### 2. Authorization Security

- **Role-Based Access Control (RBAC)**:
  - Every protected route checks user role
  - Middleware enforces permissions before route handlers
  - SuperAdmin role cannot be assigned via regular registration

- **Principle of Least Privilege**:
  - Waiters: Limited to order creation and table management
  - Admins: Cannot manage users
  - Owners: Cannot create/delete users
  - SuperAdmin: Full access but separate from business operations

### 3. Input Validation

- **Backend Validation**:
  - Mongoose schema validation
  - Required field checks
  - Type validation
  - Email format validation

- **Frontend Validation**:
  - React Hook Form with Zod schemas
  - Real-time validation feedback
  - Prevents invalid data submission

### 4. API Security

- **CORS Configuration**:
  - Whitelist of allowed origins
  - Credentials support for cookies
  - Development mode allows localhost

- **Rate Limiting** (Recommended for production):
  - Implement express-rate-limit
  - Limit login attempts
  - Prevent brute force attacks

### 5. Data Security

- **Sensitive Data**:
  - Passwords excluded from query results (`.select('-password')`)
  - JWT secret stored in environment variables
  - Database credentials in .env file (not committed to git)

- **Error Handling**:
  - Generic error messages to clients
  - Detailed errors logged server-side only
  - No stack traces in production responses

### 6. Session Management

- **Online Status Tracking**:
  - isOnline flag updated on login/logout
  - lastActivity timestamp for session timeout
  - Automatic logout on 401 responses

- **Token Refresh** (Recommended):
  - Implement refresh token mechanism
  - Short-lived access tokens (15 minutes)
  - Long-lived refresh tokens (7 days)

### 7. Production Recommendations

1. **Use HTTPS**: Encrypt all data in transit
2. **Implement Rate Limiting**: Prevent abuse
3. **Add Request Logging**: Monitor suspicious activity
4. **Use httpOnly Cookies**: Store JWT in secure cookies
5. **Implement CSRF Protection**: For cookie-based auth
6. **Add Input Sanitization**: Prevent XSS attacks
7. **Use Helmet.js**: Set security headers
8. **Regular Security Audits**: npm audit, dependency updates
9. **Environment Variables**: Never commit secrets to git
10. **Database Backups**: Regular automated backups

---

## Deployment Architecture

### Development Environment

```mermaid
graph TB
    subgraph Developer Machine
        FE[Frontend Dev Server<br/>Vite :5173]
        BE[Backend Dev Server<br/>Nodemon :5000]
    end
    
    subgraph Local Database
        DB[(MongoDB<br/>Local Instance)]
    end
    
    FE -->|API Calls| BE
    BE --> DB
```

**Development Setup**:
1. MongoDB running locally or MongoDB Atlas
2. Backend: `npm run dev` (nodemon on port 5000)
3. Frontend: `npm run dev` (Vite on port 5173)
4. Environment variables in `.env` files

---

### Production Architecture (Recommended)

```mermaid
graph TB
    subgraph Client
        Browser[Web Browser]
    end
    
    subgraph CDN/Static Hosting
        Static[Static Assets<br/>Vercel/Netlify]
    end
    
    subgraph Application Server
        LB[Load Balancer<br/>Nginx/AWS ALB]
        BE1[Backend Instance 1<br/>Node.js]
        BE2[Backend Instance 2<br/>Node.js]
        BE3[Backend Instance 3<br/>Node.js]
    end
    
    subgraph Database Cluster
        Primary[(MongoDB Primary)]
        Secondary1[(MongoDB Secondary)]
        Secondary2[(MongoDB Secondary)]
    end
    
    Browser --> Static
    Static --> LB
    LB --> BE1
    LB --> BE2
    LB --> BE3
    BE1 --> Primary
    BE2 --> Primary
    BE3 --> Primary
    Primary --> Secondary1
    Primary --> Secondary2
```

**Production Recommendations**:

1. **Frontend Deployment**:
   - Build: `npm run build`
   - Deploy to: Vercel, Netlify, or AWS S3 + CloudFront
   - Environment: Set `VITE_API_URL` to production backend URL

2. **Backend Deployment**:
   - Platform: AWS EC2, DigitalOcean, Heroku, or Railway
   - Process Manager: PM2 for process management
   - Reverse Proxy: Nginx for SSL termination and load balancing
   - Environment: Set all required environment variables

3. **Database**:
   - MongoDB Atlas (managed service)
   - Replica set for high availability
   - Automated backups
   - Connection string in environment variables

4. **CI/CD Pipeline**:
   - GitHub Actions or GitLab CI
   - Automated testing
   - Automated deployment on merge to main
   - Environment-specific deployments (staging, production)

---

### Environment Variables

#### Backend (.env)

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/khaopeeo

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h

# Client URL
CLIENT_URL=https://your-frontend-domain.com
```

#### Frontend (.env)

```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com/api
```

---

## Feature Specifications

### 1. User Authentication

**Features**:
- Email/password login
- JWT-based authentication
- Automatic token refresh on API calls
- Logout functionality
- Online status tracking

**User Flow**:
1. User enters email and password
2. System validates credentials
3. JWT token generated and returned
4. Token stored in localStorage
5. User redirected to role-specific dashboard
6. Token included in all subsequent API requests

---

### 2. SuperAdmin Dashboard

**Features**:
- View all users with real-time online status
- Create new users (owner, admin, waiter)
- Update user details (name, email, role)
- Delete users
- Toggle user active/inactive status
- View user statistics (total, by role, online/offline)
- View recent signups
- Filter users by role

**UI Components**:
- Users table with sortable columns
- Online status badges (green/gray)
- Add user modal
- Edit user modal
- Delete confirmation dialog
- Statistics cards

---

### 3. Table Management

**Features**:
- View all tables with current status
- Create new tables (owner only)
- Update table capacity
- Book/unbook tables
- View current order for each table
- Reset table after service

**Table States**:
- Available (not booked, no order)
- Booked (isBooked = true)
- Occupied (has current order)

---

### 4. Order Management

**Features**:
- Create new orders for tables
- Add multiple items to order
- Calculate total amount automatically
- View all orders
- Filter orders by status
- Update order status through workflow
- View orders by table

**Order Workflow**:
1. **Pending**: Order created but not submitted
2. **Sent to Kitchen**: Order submitted to kitchen
3. **Preparing**: Kitchen is preparing the order
4. **Ready**: Order ready for serving
5. **Served**: Order delivered to customer

---

### 5. Kitchen Display System

**Features**:
- Real-time view of all pending orders
- Filter by order status
- Update order status
- View order details (table, items, time)
- Color-coded status indicators
- Auto-refresh functionality

**Display Layout**:
- Grid of order cards
- Each card shows:
  - Table number
  - Order items with quantities
  - Order time
  - Current status
  - Action buttons

---

### 6. Billing System

**Features**:
- Generate KOT (Kitchen Order Ticket) receipts
- Generate final bills for tables
- Automatic tax calculation (18% GST)
- Itemized bill display
- Print functionality
- View all bills
- View bill by order

**Bill Components**:
- Restaurant name and details
- Table number
- Order items with prices
- Subtotal
- Tax breakdown
- Total amount
- Date and time
- Served by (staff name)

---

### 7. Served Orders Archive

**Features**:
- View historical served orders
- Filter by table number
- Filter by date range
- Pagination support
- Reprint bills
- View complete order details
- Analytics and reporting data

**Use Cases**:
- Revenue tracking
- Customer history
- Dispute resolution
- Performance analytics
- Inventory management

---

### 8. Dashboard Features

#### Owner Dashboard
- Revenue overview
- Active orders count
- Table occupancy rate
- Staff performance metrics
- Recent orders
- Quick actions (view all orders, view all bills)

#### Admin Dashboard
- Active orders management
- Bill generation
- Table status overview
- Quick order creation
- Kitchen display access

#### Waiter Dashboard
- Assigned tables
- Create new orders
- View order status
- Generate bills (if permitted)
- Table reset functionality

---

## Conclusion

Khao Peeo is a comprehensive, production-ready restaurant management system built with modern web technologies. The system provides:

- **Scalability**: MERN stack architecture supports horizontal scaling
- **Security**: JWT authentication, RBAC, input validation
- **Usability**: Intuitive dashboards for each user role
- **Reliability**: Error handling, data validation, transaction support
- **Maintainability**: Clean code structure, modular design, comprehensive documentation

### Next Steps for Production

1. Implement rate limiting and additional security measures
2. Add comprehensive unit and integration tests
3. Set up CI/CD pipeline
4. Configure production database with backups
5. Implement monitoring and logging (e.g., Sentry, LogRocket)
6. Add analytics and reporting features
7. Implement real-time updates using WebSockets
8. Add email notifications for important events
9. Create mobile-responsive designs
10. Conduct security audit and penetration testing

---

**Document Prepared By**: AI-Assisted Analysis  
**For**: Senior Developer Onboarding  
**Contact**: Refer to CREDENTIALS.txt for system access
