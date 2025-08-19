---

Created Date: 2025-08-20

# Feature Plan: Demo Login System

# Overview

We need to implement a simple but functional login system for demonstration purposes. The backend currently has a users table schema and mock auth endpoints that aren't connected to the database. This plan will connect these components to create a working authentication system suitable for demos, with proper password hashing, simple JWT tokens, and seed data for testing.

# Outcomes

- Working login endpoint that validates against real database users
- Working registration endpoint that creates users in the database
- Simple JWT-based authentication for protecting routes
- Seed users for easy demo access
- Protected endpoint to demonstrate authentication in action
- Clear documentation for demo users

# Open Questions

[ ] Should we use @fastify/jwt or jsonwebtoken for JWT generation?
- Recommendation: Use @fastify/jwt for better Fastify integration

[ ] What should be the JWT expiration time for demo purposes?
- Recommendation: 24 hours for demo convenience

[ ] Should we implement refresh tokens?
- Recommendation: No, keep it simple for demo purposes

[ ] What demo users should we seed?
- Recommendation: admin@demo.com, user@demo.com, guest@demo.com

[ ] Should we add role-based access control?
- Recommendation: No, keep it simple - just authenticated vs unauthenticated

# Tasks

## Backend Implementation

[ ] Install JWT dependencies (@fastify/jwt)

[ ] Create auth service layer
  - [ ] Create src/services/auth.service.ts
  - [ ] Implement user lookup by email/username
  - [ ] Implement password verification with bcrypt
  - [ ] Implement user creation with password hashing
  - [ ] Implement JWT token generation

[ ] Update auth controller to use real database
  - [ ] Connect login endpoint to auth service
  - [ ] Connect register endpoint to auth service
  - [ ] Add proper error handling for duplicate users
  - [ ] Add validation for password requirements

[ ] Create JWT authentication plugin
  - [ ] Create src/plugins/auth.plugin.ts
  - [ ] Register @fastify/jwt with secret
  - [ ] Create authenticate decorator for protected routes

[ ] Add protected routes for demonstration
  - [ ] Create /api/user/profile endpoint (get current user)
  - [ ] Create /api/user/update endpoint (update user profile)
  - [ ] Add authentication to these routes

[ ] Create database seeders
  - [ ] Create src/db/seed.ts
  - [ ] Add demo users (admin, user, guest)
  - [ ] Add npm script for seeding

[ ] Update environment configuration
  - [ ] Add JWT_SECRET to .env.example
  - [ ] Add default JWT_SECRET for development
  - [ ] Update documentation with new env vars

## Frontend Updates

[ ] Add login form component
  - [ ] Create src/components/LoginForm.tsx
  - [ ] Add form validation
  - [ ] Handle login errors

[ ] Add authentication context
  - [ ] Create src/contexts/AuthContext.tsx
  - [ ] Store JWT token in localStorage
  - [ ] Add logout functionality

[ ] Update API client
  - [ ] Add authentication headers to requests
  - [ ] Handle 401 responses

[ ] Create protected routes demo
  - [ ] Add profile page
  - [ ] Add route protection
  - [ ] Add login redirect

## Testing & Documentation

[ ] Add integration tests for auth endpoints
  - [ ] Test login with valid/invalid credentials
  - [ ] Test registration with duplicate emails
  - [ ] Test protected endpoints with/without token

[ ] Update API documentation
  - [ ] Update Swagger schemas for auth endpoints
  - [ ] Document authentication requirements
  - [ ] Add example requests/responses

[ ] Create demo guide
  - [ ] Document demo user credentials
  - [ ] Explain authentication flow
  - [ ] Provide testing instructions

# Security

## For Demo Purposes Only
- Clear indication that this is not production-ready
- Use of simple JWT without refresh tokens
- Basic password requirements (min 8 characters)

## Security Measures Included
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- Rate limiting on auth endpoints (already configured)
- SQL injection prevention via parameterized queries (Drizzle ORM)
- XSS prevention via proper data handling

## Not Included (would need for production)
- Refresh token rotation
- Session management
- Password reset flow
- Email verification
- Two-factor authentication
- Account lockout after failed attempts
- Audit logging of authentication events

# Database Schema

Existing users table:
```sql
- id: UUID (primary key)
- email: text (unique)
- username: text (unique)
- passwordHash: text
- isActive: boolean
- createdAt: timestamp
- updatedAt: timestamp
```

# API Interface

## POST /api/auth/login
Request:
```json
{
  "email": "user@demo.com",
  "password": "Demo123!"
}
```
Response:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@demo.com",
    "username": "demouser"
  }
}
```

## POST /api/auth/register
Request:
```json
{
  "email": "new@demo.com",
  "username": "newuser",
  "password": "Demo123!"
}
```
Response:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "new@demo.com",
    "username": "newuser"
  }
}
```

## GET /api/user/profile (Protected)
Headers:
```
Authorization: Bearer <jwt-token>
```
Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@demo.com",
    "username": "demouser",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

# Demo Credentials

| Email | Password | Description |
|-------|----------|-------------|
| admin@demo.com | Demo123! | Admin user for testing |
| user@demo.com | Demo123! | Regular user for testing |
| guest@demo.com | Demo123! | Guest user for testing |

# Implementation Notes

1. Keep the implementation simple and focused on demonstration
2. Use clear, readable code over complex abstractions
3. Include helpful error messages for demo users
4. Ensure the system is easy to reset/reseed for demos
5. Add console logs for key actions to aid in demonstrations