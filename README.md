# Systematic Web

A modern, real-time web portal built with Next.js, NestJS, PostgreSQL, and Redis.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Backend | NestJS (Node.js) |
| Database | PostgreSQL + Redis |
| ORM | Prisma |
| Real-time | Socket.io |
| Auth | Custom JWT |

## Project Structure

```
systematic-web/
├── backend/          # NestJS API server
│   ├── src/          # Source code
│   ├── prisma/       # Database schema & migrations
│   └── package.json
├── frontend/         # Next.js web application
│   ├── src/          # Source code
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Redis 7+

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Edit with your database credentials
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local  # Edit with your API URL
npm run dev
```

### Default Admin Credentials

- **Username:** sarkar
- **Password:** Sarkar@00

## Development

- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:3000`
