# Developer Guide

For sample demo credentials, role capabilities, key user flows, and lifecycle details, please refer to the consolidated [Project Notes](../Software-Engineering-Project/PROJECT_NOTES.md).

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Adding Endpoints](#adding-endpoints)
5. [Frontend Patterns](#frontend-patterns)
6. [Testing](#testing)
7. [Contributing](#contributing)

---

## Architecture

The backend uses a layered architecture:

```
Routes → Middleware → Controllers → Services → DB
```

- **Routes** define endpoint paths and attach middleware
- **Middleware** handles JWT auth (`verifyToken`), input validation, rate limiting, and RBAC
- **Controllers** parse request/response and delegate to services
- **Services** contain all business logic (coupon generation, expiry checks, fraud detection)

The frontend is a React SPA using Context API for auth state and a service layer to abstract all API calls.

---

## Database Schema

Key tables:

| Table | Purpose |
|---|---|
| `users` | Accounts, roles, credentials |
| `campaigns` | Campaign config (discount, dates, limits) |
| `coupons` | Individual codes tied to campaigns |
| `redemptions` | Redemption records per user/coupon |
| `redemption_logs` | Detailed audit trail |

Full schema: `Software-Engineering-Project/database/schema.sql`

---

## API Reference

**Base URL:** `http://localhost:5001/api`  
**Auth:** `Authorization: Bearer <token>` on all protected routes

### Auth — `/api/auth`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register user | — |
| POST | `/login` | Login, returns JWT | — |
| GET | `/profile` | Get current user | ✓ |
| PUT | `/profile` | Update profile | ✓ |
| PUT | `/change-password` | Change password | ✓ |
| GET | `/verify` | Verify JWT token | ✓ |

**Register body:**
```json
{ "name": "string", "email": "string", "password": "string", "role": "customer|merchant|admin", "phone": "string" }
```

### Users — `/api/users`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/stats` | Aggregate user statistics | ✓ |
| GET | `/` | List all users (admin) | ✓ |
| GET | `/:id` | Get user by ID | ✓ |
| POST | `/` | Create user (admin) | ✓ |
| PUT | `/:id` | Update user | ✓ |
| DELETE | `/:id` | Delete user (admin) | ✓ |

### Campaigns — `/api/campaigns`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/` | Create campaign | ✓ |
| GET | `/` | List campaigns | ✓ |
| GET | `/:id` | Get campaign | ✓ |
| PUT | `/:id` | Update campaign | ✓ |
| PATCH | `/:id/status` | Update campaign status | ✓ |
| DELETE | `/:id` | Delete campaign | ✓ |
| GET | `/:id/stats` | Campaign statistics | ✓ |

**Create body:**
```json
{
  "name": "string",
  "description": "string",
  "type": "percentage|fixed|bogo|free_shipping",
  "discount": 10,
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-03-01T00:00:00Z",
  "max_redemptions": 100,
  "budget": 5000
}
```

### Coupons — `/api/coupons`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/generate` | Generate codes for a campaign | ✓ |
| GET | `/` | List coupons (role-filtered on the backend) | ✓ |
| GET | `/:identifier` | Get coupon by ID or code | ✓ |
| POST | `/:id/qr` | Generate QR data for a coupon | ✓ |
| POST | `/:id/assign` | Assign a coupon to a user | ✓ |
| POST | `/expire` | Expire outdated coupons (admin) | ✓ |
| DELETE | `/:id` | Delete coupon | ✓ |

**Generate body:** `{ "campaign_id": 1, "count": 50, "code_length": 12, "prefix": "SALE" }`

### Redemptions — `/api/redemptions`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/redeem` | Redeem a coupon | — |
| GET | `/validate/:code` | Validate without redeeming | — |
| GET | `/history` | Redemption history for the authenticated user | ✓ |

**Redeem body:** `{ "code": "string", "order_amount": 199.99 }`

### Reports — `/api/reports`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/merchant` | Merchant report summary | ✓ |
| GET | `/dashboard` | Dashboard analytics by role | ✓ |
| GET | `/export-csv` | Export report data as CSV | ✓ |
| GET | `/campaign/:id/metrics` | Campaign metrics | ✓ |
| GET | `/system-stats` | Admin system statistics | ✓ |
| GET | `/customer-stats` | Customer dashboard statistics | ✓ |

### Distribution — `/api/distribution`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/email` | Send coupons by email | ✓ |
| POST | `/sms` | Send coupons by SMS | ✓ |
| POST | `/retry` | Retry failed distributions (admin) | ✓ |
| GET | `/logs` | Distribution logs | ✓ |
| GET | `/campaign/:campaign_id/stats` | Campaign distribution statistics | ✓ |

**Distribute body:**
```json
{ "campaign_id": 1, "recipients": ["user@example.com"] }
```

### Error Format

```json
{ "error": "Descriptive message", "code": "ERROR_CODE" }
```

Common codes: `400` Bad Request · `401` Unauthorized · `403` Forbidden · `404` Not Found · `500` Server Error

### Rate Limits

| Scope | Limit |
|---|---|
| Auth endpoints | 5 req / 15 min |
| Registration | 3 req / hour |
| General API | 100 req / 15 min |

---

## Adding Endpoints

**1. Route**

```javascript
// routes/example.js
import express from 'express';
import { getExample } from '../controllers/exampleController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.get('/', verifyToken, getExample);
export default router;
```

**2. Controller**

```javascript
// controllers/exampleController.js
export const getExample = async (req, res) => {
  try {
    const data = await exampleService.get();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

**3. Register in server.js**

```javascript
import exampleRoutes from './routes/example.js';
app.use('/api/example', exampleRoutes);
```

---

## Frontend Patterns

**New component:**

```javascript
// components/ExampleCard.jsx
import React from 'react';

const ExampleCard = ({ title, value }) => (
  <div className="rounded-lg border p-4">
    <h3 className="font-semibold">{title}</h3>
    <p>{value}</p>
  </div>
);

export default ExampleCard;
```

**API call:**

```javascript
// api/exampleApi.js
import api from '../services/api';

export const fetchExample = () => api.get('/example').then(r => r.data);
```

**Using auth context:**

```javascript
import { useAuth } from '../context/AuthContext';
const { user, isAuthenticated, isAdmin, isMerchant } = useAuth();
```

---

## Testing

```bash
cd Software-Engineering-Project/backend
npm start              # start the Express API

cd ../frontend
npm run build          # build the React app
```

There is no automated test runner configured in the current package scripts. The main verification flow is backend startup plus a successful frontend production build.

---

## Contributing

### Branch Strategy

```
main        → production
develop     → integration branch
feature/*   → new features (branch off develop)
bugfix/*    → bug fixes
```

### Workflow

1. Branch off `develop`: `git checkout -b feature/your-feature`
2. Make changes, write/update tests
3. Open a PR to `develop`
4. Request review from a team member
5. Merge after approval

### Commit Convention

```
feat:      new feature
fix:       bug fix
refactor:  code change with no functional impact
test:      test additions or changes
docs:      documentation only
style:     formatting, whitespace
```
