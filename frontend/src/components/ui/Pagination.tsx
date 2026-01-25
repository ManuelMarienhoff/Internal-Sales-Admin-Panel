import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getPageNumbers = (current: number, total: number) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('ellipsis');

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (end < total - 1) pages.push('ellipsis');

  pages.push(total);
  return pages;
};

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handleChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between border border-gray-200 px-4 py-3 bg-white mt-6 shadow-sm">
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        {currentPage > 1 && (
          <button
            type="button"
            className="px-3 py-1 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => handleChange(currentPage - 1)}
          >
            Previous
          </button>
        )}

        {pages.map((page, idx) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
          ) : (
            <button
              key={page}
              type="button"
              className={`px-3 py-1 text-sm border ${page === currentPage ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handleChange(page)}
            >
              {page}
            </button>
          )
        ))}

        {currentPage < totalPages && (
          <button
            type="button"
            className="px-3 py-1 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => handleChange(currentPage + 1)}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
