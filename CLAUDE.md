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

Remaining work: sections 2.0 (backend), 3.0 (frontend) and 4.0 (deploy and test).

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
