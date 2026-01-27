import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getPageNumbers = (current: number, total: number) => {
  const maxVisibleButtons = 5;

  // If total pages fit within max visible, show all
  if (total <= maxVisibleButtons) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // Calculate ideal range centered on current page
  let start = current - 2;
  let end = current + 2;

  // Clamping: Adjust if out of bounds
  if (start < 1) {
    start = 1;
    end = maxVisibleButtons;
  } else if (end > total) {
    end = total;
    start = total - maxVisibleButtons + 1;
  }

  const pages: (number | 'ellipsis')[] = [];

  // Add first page and ellipsis if there's a gap
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('ellipsis');
    }
  }

  // Add the visible range
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  // Add ellipsis and last page if there's a gap
  if (end < total) {
    if (end < total - 1) {
      pages.push('ellipsis');
    }
    pages.push(total);
  }

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
    <div className="flex items-center justify-between border border-gray-200 px-4 py-3 bg-white shadow-sm">
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-1 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          onClick={() => handleChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

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

        <button
          type="button"
          className="px-3 py-1 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          onClick={() => handleChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
