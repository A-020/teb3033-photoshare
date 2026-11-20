# CLAUDE.md

Instructions for Claude Code working in this repository.

## Project

TEB3033 Distributed Photo Sharing System. A university group assignment.
The full specification is `docs/TEB3033_Implementation_Guide.pdf`. Read it before starting any section. It is the source of truth for endpoints, file layout, status codes and checkpoints.

Stack: React (Vite) client, Node.js and Express API, MySQL 8, AWS S3. EC2 and RDS come only in section 4.0.

## Status

Section 1.0 is done:
- Monorepo folders exist (`backend/`, `frontend/`, `database/`, `testing/`, `docs/`).
- `database/schema.sql` defines 7 tables and is loaded into local MySQL.
- AWS budget alert, IAM user `photoshare-dev` and access keys are set up by the student.

Section 2.0 (backend) is done:
- 2.1: Express server, shared MySQL pool in `src/config/db.js` and `GET /api/health`.
- 2.2 to 2.3: Register and login with bcrypt and a JWT that expires in 1 day. `middleware/auth.js` checks the Bearer token and sets `req.user`.
- 2.4: Friend groups in `routes/group.routes.js`. Group creation and the creator's membership run in one transaction. `middleware/membership.js` checks group membership.
- 2.5: Photos in `routes/photo.routes.js` and `config/s3.js`. Multer memory storage with a 5 MB limit and an image type filter. S3 key `photos/<uuidv4><ext>`. The photo and tags insert in one transaction, and the S3 object is removed if the insert fails. Pre-signed URLs last 3600 seconds. Delete removes the row first (ownership checked in SQL), then the S3 object. The student chose to keep this order. Commit `d96ecda` holds this code but is named "2.4 Friend groups". The student chose to keep the name.
- 2.6: Comments in `routes/comment.routes.js`, mounted at `/api`. The comment author or the photo owner may delete a comment.
- 2.7: Feed search and filters (keyword, tag, uploader and date range) built as a dynamic WHERE clause with `?` parameters. LIKE input is escaped.
- 2.8: `testing/postman_collection.json` with one request per Appendix A endpoint and a `token` variable. All 24 tests pass. `testing/helpers.ps1` holds PowerShell test helpers.

Section 3.0 (frontend) is done:
- 3.1: Vite and React setup. `src/api.js` is an axios client that adds the token. The Vite dev server proxies `/api` to the backend.
- 3.2: `AuthContext.jsx`, Login and Register pages, `Navbar` and `ProtectedRoute`.
- 3.3: Groups page, `GroupSelect`, `hooks/useGroups.js` and `selectedGroup.js` to remember the selected group.
- 3.4: Feed and Upload pages with `PhotoCard`.
- 3.5: PhotoDetail page with `CommentList`. Delete shows for the comment author and the photo owner.
- 3.6: `SearchBar` and `filters.js`. Filters live in the URL query and use a 300 ms debounce.
- 3.x: Frosted glass redesign following `docs/UI_DESIGN.md`. New shared components: Alert, AuthLayout, Avatar, BackdropDim, EmptyState, PageHeader, PasswordInput, SkeletonCard and Spinner. The glass tint is navy (`--glass-tint: rgba(22,28,51,0.65)`) so text keeps good contrast. API calls and app logic were not changed.

Section 4.0 (deploy and test) is in progress:
- 4.1 to 4.2: Done by the student in the AWS console. RDS MySQL (Public access: No), an IAM role for S3 and an EC2 server. The server runs Node 24 LTS (`uuid@14` needs Node 20.19 or later) with a 2 GB swap file for builds. S3 uses the IAM role, so the server `.env` has no AWS keys.
- 4.3 (checkpoint passed): `deploy/nginx.conf` serves the React build from `/var/www/photoshare`, falls back to `index.html` for React Router, proxies `/api/` to `127.0.0.1:5000` and sets `client_max_body_size 10M`. PM2 runs the API as `photoshare-api`. `db.js` sets `timezone: '+08:00'` and runs `SET time_zone = '+08:00'` on each new connection, because RDS runs in UTC. Date filters then follow Malaysia days.

Remaining work: 4.4 multi-user testing, 4.5 cost evidence and 4.6 teardown.

To update the EC2 server after a push: `cd ~/app && git pull && pm2 restart photoshare-api`.

## How to work

- Work one step at a time (for example 2.1, then 2.2). Do not jump ahead.
- After each step, list the checkpoint items from the guide and tell the student how to verify them (curl or Postman commands). Wait for confirmation before the next step.
- Explain briefly what each new file does and why. The student is learning, so prefer short explanations over silent code dumps.
- Suggest a commit at each milestone in Appendix C of the guide. Use the milestone names as commit messages.

## Rules that must not be broken

- Never commit `.env`. Only `.env.example` with empty values.
- Never hardcode AWS keys, DB passwords or JWT secrets.
- Use parameterised queries (`?` placeholders) for every SQL statement. No string concatenation of user input.
- Use the shared `mysql2/promise` pool in `src/config/db.js`. Never open a connection per request.
- Stateless JWT auth. No server sessions.
- S3 keys use `photos/<uuidv4><ext>`. The bucket stays private. Serve images with pre-signed URLs.
- Use transactions where the guide says so (group creation, photo insert with tags).
- Enforce ownership inside SQL (`WHERE id = ? AND user_id = ?`) and check `affectedRows`.
- The table is `friend_groups`, not `groups` (reserved word in MySQL 8).
- Region is always `ap-southeast-1`.
- Return status codes exactly as listed in Appendix B. Never return `password_hash`.

## Section 4.0 notes

- AWS console steps (RDS, IAM role, EC2, security groups) are done by the student. Give clear click-by-click steps and the exact shell commands for the EC2 server.
- On EC2 the S3 client gets credentials from the IAM role. Leave AWS keys out of the server `.env`.
- Remind the student to take console screenshots for the report.
- Remind the student about teardown order after grading (guide section 4.6).

## Writing style for docs and messages

- Formal academic tone. Simple sentences.
- No em dashes or en dashes.
- No Oxford comma before "and".
