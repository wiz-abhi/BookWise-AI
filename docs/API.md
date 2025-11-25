# BookBuddy Backend - API Reference

## Base URL
```
http://localhost:3001/api
```

## Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T12:00:00.000Z"
}
```

---

### Upload Book

```http
POST /api/upload
Content-Type: multipart/form-data
```

**Request Body:**
- `file` (file): PDF, EPUB, or TXT file
- `userId` (string): User ID
- `title` (string, optional): Book title
- `author` (string, optional): Author name
- `language` (string, optional): Language code (default: 'en')

**Response:**
```json
{
  "message": "File uploaded successfully",
  "book": {
    "id": "uuid",
    "title": "Book Title",
    "author": "Author Name",
    "createdAt": "2025-11-25T..."
  },
  "ingestionJobId": "uuid"
}
```

---

### Check Ingestion Status

```http
GET /api/ingest/status/:jobId
```

**Response:**
```json
{
  "jobId": "uuid",
  "bookId": "uuid",
  "status": "processing",
  "progress": 75,
  "totalChunks": 150,
  "errorMessage": null,
  "createdAt": "2025-11-25T...",
  "updatedAt": "2025-11-25T..."
}
```

**Status values:** `pending`, `processing`, `completed`, `failed`

---

### RAG Query

```http
POST /api/query
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "Who is the main character?",
  "userId": "user-id",
  "bookId": "book-id",
  "k": 5,
  "persona": "friend"
}
```

**Parameters:**
- `query` (string, required): User's question
- `userId` (string, optional): User ID for personalization
- `bookId` (string, optional): Limit search to specific book
- `k` (number, optional): Number of chunks to retrieve (default: 5)
- `persona` (string, optional): Response style - `scholar`, `friend`, or `quizzer` (default: `friend`)

**Response:**
```json
{
  "answer": "The main character is...",
  "citations": [
    {
      "bookId": "uuid",
      "bookTitle": "Book Title",
      "page": 42,
      "chapter": "Chapter 3",
      "excerpt": "Excerpt from the book..."
    }
  ],
  "confidence": 0.85
}
```

---

### Send Chat Message

```http
POST /api/chat/:convId/message
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Tell me more about that",
  "userId": "user-id",
  "bookId": "book-id",
  "persona": "friend"
}
```

**Response:**
```json
{
  "conversationId": "conv-id",
  "message": {
    "role": "assistant",
    "content": "Based on the previous context...",
    "citations": [...],
    "confidence": 0.9
  }
}
```

---

### Get Conversation History

```http
GET /api/chat/:convId
```

**Response:**
```json
{
  "id": "conv-id",
  "userId": "user-id",
  "title": "Conversation Title",
  "messages": [
    {
      "role": "user",
      "content": "Who is the main character?"
    },
    {
      "role": "assistant",
      "content": "The main character is..."
    }
  ],
  "createdAt": "2025-11-25T...",
  "updatedAt": "2025-11-25T..."
}
```

---

### Save User Memory

```http
POST /api/user/memory
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-id",
  "bookId": "book-id",
  "quoteText": "This is a memorable quote",
  "page": 42,
  "memoryType": "quote",
  "metadata": {}
}
```

**Memory Types:** `quote`, `preference`, `goal`, `note`

**Response:**
```json
{
  "message": "Memory saved successfully",
  "memoryId": "uuid",
  "createdAt": "2025-11-25T..."
}
```

---

### Get Book Quotes

```http
GET /api/book/:bookId/quotes?userId=user-id
```

**Response:**
```json
{
  "bookId": "book-id",
  "quotes": [
    {
      "id": "uuid",
      "text": "Quote text",
      "page": 42,
      "metadata": {},
      "bookTitle": "Book Title",
      "author": "Author Name",
      "createdAt": "2025-11-25T..."
    }
  ]
}
```

---

### Get User Library

```http
GET /api/user/:userId/library
```

**Response:**
```json
{
  "books": [
    {
      "id": "uuid",
      "title": "Book Title",
      "author": "Author Name",
      "language": "en",
      "totalPages": 200,
      "createdAt": "2025-11-25T..."
    }
  ]
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "message": "Detailed error description (development only)"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Persona Modes

### Scholar
- Analytical, academic tone
- Detailed explanations with literary analysis
- References themes and historical context

### Friend
- Conversational, accessible tone
- Relatable examples and analogies
- Friendly and engaging

### Quizzer
- Educational tone
- Poses follow-up questions
- Encourages critical thinking

---

## Rate Limiting

Currently no rate limiting is enforced in development. In production, implement per-user quotas.

---

## Testing with curl

### Upload a book
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@book.pdf" \
  -F "userId=test-user" \
  -F "title=Test Book"
```

### Query
```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Who is the main character?",
    "userId": "test-user",
    "persona": "friend"
  }'
```

### Save quote
```bash
curl -X POST http://localhost:3001/api/user/memory \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "bookId": "book-id",
    "quoteText": "Memorable quote",
    "page": 42,
    "memoryType": "quote"
  }'
```
