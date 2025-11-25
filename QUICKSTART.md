# BookBuddy - Quick Start Guide

## Prerequisites Checklist

Before you begin, make sure you have:

- ✅ Node.js 20+ installed
- ✅ Docker and Docker Compose installed
- ✅ Neon DB account created
- ✅ Gemini API key (from Google AI Studio)

## Step-by-Step Setup

### 1. Set Up Neon DB

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project called "bookbuddy"
3. Copy your connection string (it looks like: `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`)
4. Run the database schema:

```bash
# Replace $DATABASE_URL with your actual connection string
psql "postgresql://neondb_owner:npg_H2FSvoVtnOe3@ep-old-waterfall-a10npwkf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -f backend/src/db/schema.sql
```

Or use the Neon SQL Editor in the web console and paste the contents of `backend/src/db/schema.sql`.

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key (starts with `AIza...`)

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp env.example .env
```

Edit `.env` and fill in your actual values:

```env
# Database (Neon DB)
DATABASE_URL=postgresql://your-user:your-password@your-host.neon.tech/bookbuddy?sslmode=require

# Gemini AI
GEMINI_API_KEY=AIzaSy...your-actual-key

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-random-string-here

# Redis (default is fine for local development)
REDIS_URL=redis://localhost:6379

# Storage (use 'local' for development)
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 5. Start Docker Services

Start Redis (required for job queue):

```bash
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
```

You should see:
- `redis` - Running on port 6379
- `minio` - Running on ports 9000 and 9001 (optional)

### 6. Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
✅ Connected to Neon DB (PostgreSQL)
📁 Local storage initialized at: ./uploads
🚀 BookBuddy API server running on port 3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

You should see:
```
  ▲ Next.js 16.0.4
  - Local:        http://localhost:3000
```

### 7. Test the Setup

1. Open your browser to [http://localhost:3000](http://localhost:3000)
2. Check backend health: [http://localhost:3001/health](http://localhost:3001/health)

## Testing File Upload

You can test the upload endpoint with curl:

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@/path/to/your/book.pdf" \
  -F "userId=test-user" \
  -F "title=My Test Book" \
  -F "author=Test Author"
```

Check ingestion status:

```bash
curl http://localhost:3001/api/ingest/status/JOB_ID_HERE
```

## Troubleshooting

### Database Connection Issues

- Make sure your Neon DB connection string is correct
- Check that the database has the pgvector extension enabled
- Verify the schema was created successfully

### Redis Connection Issues

- Make sure Docker is running: `docker ps`
- Restart Redis: `docker-compose restart redis`

### Gemini API Issues

- Verify your API key is correct
- Check you have quota remaining (free tier has limits)
- Make sure there are no extra spaces in the `.env` file

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Find and kill the process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change the port in .env
PORT=3002
```

## Next Steps

Once everything is running:

1. **Upload a book** - Try uploading a PDF, EPUB, or TXT file
2. **Monitor ingestion** - Watch the backend console for ingestion progress
3. **Check the database** - Verify chunks are being stored in Neon DB
4. **Build the chat UI** - Continue with Milestone 2 (RAG & Chat Interface)

## Useful Commands

```bash
# View Docker logs
docker-compose logs -f redis

# Stop Docker services
docker-compose down

# Restart backend
cd backend && npm run dev

# Build for production
npm run build
cd backend && npm run build
```

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Make sure all services (Neon DB, Redis) are accessible
4. Review the README.md for additional documentation

---

**You're all set!** 🎉 The backend is now ready to accept book uploads and process them through the ingestion pipeline.
