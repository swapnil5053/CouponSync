# Project Notes

## Overview

This document consolidates the important project-specific notes that were previously split across multiple markdown files in `Software-Engineering-Project/`.

It focuses on the parts most useful for demos, reviews, and maintenance:

- sample credentials
- role-based capabilities
- key user flows
- coupon lifecycle and security features
- practical verification notes

---

## Demo Credentials

### Admin

- Email: `admin@vcds.com`
- Password: `Admin@123`

### Merchants

- `merchant@example.com` / `Admin@123`
- `techstore@merchant.com` / `Merchant@123`
- `fashionhub@merchant.com` / `Merchant@123`
- `foodmart@merchant.com` / `Merchant@123`

### Customers

- `john.doe@gmail.com` / `Customer@123`
- `jane.smith@yahoo.com` / `Customer@123`
- `bob.wilson@gmail.com` / `Customer@123`
- `alice.brown@outlook.com` / `Customer@123`
- `charlie.davis@gmail.com` / `Customer@123`
- `customer@example.com` / `Customer@123`

---

## Role Summary

### Admin

- Manages users and monitors all system activity
- Accesses system-wide reports and platform statistics
- Reviews redemptions, fraud-related activity, and distribution retries

### Merchant

- Creates and manages campaigns
- Generates coupon batches for campaigns
- Tracks campaign performance, redemptions, and reports
- Distributes coupons through email and SMS flows

### Customer

- Browses active campaigns
- Claims coupons from available campaigns
- Views owned coupons in `My Coupons`
- Redeems coupons and tracks savings/history

---

## Key User Flows

### Merchant Flow

1. Log in as a merchant
2. Create a campaign from `/campaigns`
3. Generate coupons from the campaign flow or the coupons page
4. Review coupon status and optionally distribute codes
5. Monitor results in `/reports`

### Customer Flow

1. Log in as a customer
2. Open `/browse-campaigns`
3. Search or filter active campaigns
4. Claim a coupon from a campaign
5. Redeem it immediately or later from `/my-coupons` or `/redeem-coupon`
6. Review redemption history and savings on the dashboard

### Admin Flow

1. Log in as admin
2. Manage users from `/users`
3. Monitor campaign, coupon, and redemption activity
4. Review system-wide reporting from `/reports`

---

## Coupon Lifecycle

Coupons move through these main states:

- `generated`
- `distributed`
- `active`
- `redeemed`
- `expired`
- `revoked`

Typical path:

`generated -> distributed/active -> redeemed`

Expired or revoked coupons are excluded from normal redemption flow.

---

## Security And Validation Notes

### Coupon Security

- Unique alphanumeric coupon generation
- Cryptographic randomness using Node's `crypto` utilities
- AES-based encrypted coupon storage alongside lookup-friendly code values
- Duplicate prevention through generation checks and database constraints
- Admin-triggered expiration flow for outdated coupons

### Platform Security

- JWT authentication
- Role-based access control
- Input validation with `express-validator`
- Request rate limiting
- Fraud-aware redemption checks
- Parameterized database queries

---

## Reporting Highlights

The reports section currently covers:

- total campaigns
- active and paused campaigns
- total coupons
- redeemed and expired coupons
- merchant report tables
- campaign metrics
- CSV export
- system stats for admin accounts

---

## Practical Verification

The current project state has been checked with:

- successful frontend production build via `npm run build`
- backend syntax validation across backend `.js` files
- backend health endpoint returning a healthy response

Main local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001`
- Health check: `http://localhost:5001/health`

---

## Notes

- The main public-facing documentation should remain `README.md`.
- The implementation reference should remain `docs/developer-guide.md`.
- This file is the consolidated project-specific notes file kept in place of the previous scattered markdown notes.
