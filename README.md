# TEB3033 Distributed Photo Sharing System

A three-tier photo sharing system. Users join friend groups and share photos privately inside each group.

## Architecture

Browser -> Nginx on EC2 (React build) -> Express API on EC2 -> RDS MySQL and S3

| Tier | Technology | Folder |
|------|------------|--------|
| Client | React (Vite) | `frontend/` |
| Application | Node.js and Express | `backend/` |
| Data | MySQL 8 (RDS) and S3 | `database/` |

## Repository layout

```
backend/    Express API (application tier)
frontend/   React app (client tier)
database/   schema.sql (data tier definition)
testing/    Postman collection and load test scripts
docs/       Implementation guide
```

## Local setup

1. Load the schema: `mysql -u root -p < database/schema.sql`
2. Backend: copy `backend/.env.example` to `backend/.env`, fill in values, then `npm install` and `npm run dev`.
3. Frontend: `npm install` and `npm run dev` inside `frontend/`.

## Region

All AWS resources use `ap-southeast-1` (Singapore).

## Progress

- [x] 1.0 Setup (repo, AWS safety, schema)
- [ ] 2.0 Backend
- [ ] 3.0 Frontend
- [ ] 4.0 Deploy and test
