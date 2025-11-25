# BookBuddy — Next-gen AI Book Companion

A production-ready RAG-based web application that allows users to upload books and have context-aware, citation-backed conversations with an AI assistant powered by Gemini.

## 🚀 Features

- **Multi-format Support**: Upload PDF, EPUB, and TXT files
- **Smart Ingestion**: Automatic text extraction with OCR fallback for scanned pages
- **RAG-Powered Chat**: Context-aware conversations with accurate citations
- **User Memory**: Save quotes, preferences, and reading goals
- **Persona Modes**: Switch between Scholar, Friend, and Quizzer personalities
- **Vector Search**: Fast semantic search using PostgreSQL with pgvector

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** with TypeScript and App Router
- **Tailwind CSS 4** for styling
- **Radix UI** for accessible components
- **Zustand** for state management
- **React Query** for data fetching

### Backend
- **Node.js/TypeScript** with Express
- **Neon DB** (Serverless PostgreSQL with pgvector)
- **Gemini 2.0 Flash** for LLM (with Gemini 1.5 Pro fallback)
- **Gemini text-embedding-004** for embeddings
- **Bull** for job queue (Redis)
- **Tesseract.js** for OCR

### Storage
- Local filesystem (development)
- MinIO (S3-compatible, production)

## 📋 Prerequisites

- Node.js 20+ and npm
- Neon DB account (free tier available)
- Gemini API key (Pro subscription recommended)
- Docker and Docker Compose (for Redis and MinIO)

## 🏗️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

Edit `.env` with your actual values:
- `DATABASE_URL`: Your Neon DB connection string
- `GEMINI_API_KEY`: Your Gemini API key
- `JWT_SECRET`: A secure random string

### 3. Set Up Neon DB

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy the connection string to your `.env` file
4. Run the schema migration:

```bash
# Connect to your Neon DB and run the schema
psql $DATABASE_URL -f backend/src/db/schema.sql
```

### 4. Start Docker Services

Start Redis and MinIO (optional):

```bash
docker-compose up -d
```

### 5. Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## 📁 Project Structure

```
bookbuddy/
├── app/                    # Next.js app directory
│   ├── chat/              # Chat interface
│   ├── upload/            # File upload page
│   └── library/           # Book library
├── components/            # React components
│   ├── chat/             # Chat-related components
│   ├── upload/           # Upload components
│   └── quotes/           # Quotes panel
├── lib/                   # Utility functions
├── backend/              # Express backend
│   └── src/
│       ├── server.ts     # Main server file
│       ├── db/           # Database connection and schema
│       ├── routes/       # API routes
│       ├── services/     # Business logic
│       └── middleware/   # Express middleware
├── docker-compose.yml    # Docker services
└── env.example          # Environment variables template
```

## 🔧 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Start production server
- `npm test` - Run tests

## 🌐 API Endpoints

- `GET /health` - Health check
- `POST /api/upload` - Upload a book
- `GET /api/ingest/status/:jobId` - Check ingestion status
- `POST /api/query` - Query with RAG
- `POST /api/chat/:convId/message` - Send chat message
- `GET /api/book/:id/quotes` - Get saved quotes
- `POST /api/user/memory` - Save user preferences

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests (to be added)
npm test
```

## 🚢 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options
- **Railway**: Free tier available
- **Render**: Free tier with auto-sleep
- **Fly.io**: Free tier with resource limits
- **VPS**: Oracle Cloud Always Free, Google Cloud $300 credit

## 📝 Environment Variables

See `env.example` for all available environment variables.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Gemini AI](https://ai.google.dev/)
- Database powered by [Neon](https://neon.tech)
- Vector search with [pgvector](https://github.com/pgvector/pgvector)

---

**Note**: This project requires a Gemini API key. Get yours at [Google AI Studio](https://makersuite.google.com/app/apikey).
