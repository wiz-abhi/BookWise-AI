import Link from 'next/link';
import { BookOpen, Upload, MessageSquare, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BookBuddy
            </h1>
          </div>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your AI-powered book companion. Upload books and have intelligent, citation-backed conversations.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/upload"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload a Book
            </Link>
            <Link
              href="/chat"
              className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-gray-200 dark:border-gray-700"
            >
              <MessageSquare className="w-5 h-5" />
              Start Chatting
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Multi-Format Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload PDF, EPUB, and TXT files. Automatic text extraction with OCR fallback.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              AI-Powered Answers
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get accurate answers with citations powered by Gemini 2.0 Flash.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Three Personas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose between Scholar, Friend, or Quizzer modes for different conversation styles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
