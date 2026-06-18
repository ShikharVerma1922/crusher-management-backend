# API Routes Documentation

## Authentication Routes (`/auth`)

### POST `/login`

- **Description**: User login
- **Auth**: Public
- **Body**: Credentials (username/email, password)
- **Response**: Authentication token, user data

### POST `/register`

- **Description**: Create new user account
- **Auth**: Protected, OWNER role only
- **Body**: User registration data
- **Response**: New user data

### POST `/logout`

- **Description**: User logout
- **Auth**: Protected
- **Response**: Logout confirmation

---

## Transaction Routes (`/transaction`)

### GET `/`

- **Description**: Get full transaction ledger (all transactions)
- **Auth**: Protected - SUPERVISOR, OWNER
- **Query**: Pagination, filtering options
- **Response**: List of all transactions

### GET `/shift`

- **Description**: Get transactions for current shift
- **Auth**: Protected - CLERK
- **Response**: List of transactions for current shift

### POST `/`

- **Description**: Record new transaction (data entry)
- **Auth**: Protected - CLERK
- **Body**: Transaction details (amount, material, etc.)
- **Response**: Created transaction record

### POST `/:id/reprint`

- **Description**: Trigger manual receipt reprint
- **Auth**: Protected - All authenticated users
- **Params**: Transaction ID
- **Response**: Reprint confirmation

---

## Material Routes (`/material`)

### GET `/`

- **Description**: List all materials
- **Auth**: Protected
- **Query**: Pagination, filtering options
- **Response**: List of materials with details

### POST `/`

- **Description**: Create new material
- **Auth**: Protected - OWNER
- **Body**: Material details (name, specifications, etc.)
- **Response**: Created material record

### PATCH `/:id`

- **Description**: Edit material details
- **Auth**: Protected - OWNER
- **Params**: Material ID
- **Body**: Updated material data
- **Response**: Updated material record

---

## Void/Correction Routes (`/void`)

### POST `/`

- **Description**: File void/correction request (error reporting)
- **Auth**: Protected - CLERK
- **Body**: Void request details (reason, transaction reference, etc.)
- **Response**: Created void request

### GET `/pending`

- **Description**: List pending void requests
- **Auth**: Protected - SUPERVISOR, OWNER
- **Query**: Filtering, pagination
- **Response**: List of pending void requests

### PATCH `/:id`

- **Description**: Resolve/approve void request
- **Auth**: Protected - SUPERVISOR, OWNER
- **Params**: Void request ID
- **Body**: Resolution data (approved/rejected, notes)
- **Response**: Updated void request with resolution
