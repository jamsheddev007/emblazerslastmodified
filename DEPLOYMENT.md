# Hostinger Node.js Deployment Guide

## Prerequisites
- Hostinger Node.js hosting plan
- PostgreSQL database (Supabase or Hostinger MySQL/PostgreSQL)
- Domain configured

## Deployment Steps

### 1. Prepare Files
Upload these files/folders to your Hostinger Node.js app directory:
```
├── dist/                 # Built files (run `npm run build` locally first)
├── node_modules/         # Run `npm install --production` on server
├── server/               # Source files (optional, for debugging)
├── shared/               # Source files (optional, for debugging)
├── package.json
├── package-lock.json
└── .env                  # Create this on server (DO NOT upload from local)
```

### 2. Set Environment Variables on Hostinger
Create a `.env` file on your Hostinger server with:
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com

# PostgreSQL Database
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-db-user
PGPASSWORD=your-db-password
PGDATABASE=your-db-name

JWT_SECRET=your-secure-random-string-here

SUPER_ADMIN_EMAIL=superadmin@your-domain.com
SUPER_ADMIN_PASSWORD_HASH=your-bcrypt-hashed-password
```

### 3. Install Dependencies
```bash
npm install --production
```

### 4. Build (if not already built)
```bash
npm run build
```

### 5. Start the Application
```bash
npm run start:prod
```

Or use PM2 (recommended for production):
```bash
pm2 start dist/index.cjs --name "emblazers" --env production
pm2 save
pm2 startup
```

### 6. Database Setup
Run migrations if needed:
```bash
npm run db:push
```

## Hostinger-Specific Notes

1. **Port**: Hostinger assigns a port via `PORT` environment variable. The app defaults to 5000.
2. **Startup File**: Set to `dist/index.cjs` in Hostinger panel.
3. **Node.js Version**: Use Node.js 18.x or higher.
4. **Environment Variables**: Set these in Hostinger's Node.js app dashboard, not just `.env`.

## Troubleshooting

- Check logs: `pm2 logs emblazers` or check Hostinger logs
- Database connection: Verify `PG*` variables are correct
- Port issues: Ensure `PORT` env var matches Hostinger's assigned port
- Build errors: Run `npm run build` locally and upload `dist/` folder
