import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">Страница не найдена</p>
        <Link
          href="/"
          className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}


