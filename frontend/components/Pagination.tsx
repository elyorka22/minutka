// ============================================
// Pagination Component
// ============================================

'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, hasNext, hasPrev }: PaginationProps) {
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev && currentPage === 1}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          hasPrev && currentPage > 1
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Назад
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            page === currentPage
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext && currentPage === totalPages}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          hasNext && currentPage < totalPages
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Вперед
      </button>
    </div>
  );
}

