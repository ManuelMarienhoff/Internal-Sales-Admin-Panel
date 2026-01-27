import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getPageNumbers = (current: number, total: number) => {
  // Small totals: show everything without truncation
  if (total <= 6) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  const leftNeighbor = Math.max(2, current - 1);
  const rightNeighbor = Math.min(total - 1, current + 1);

  pages.push(1);

  if (leftNeighbor > 2) {
    pages.push('ellipsis');
  }

  for (let i = leftNeighbor; i <= rightNeighbor; i += 1) {
    pages.push(i);
  }

  if (rightNeighbor < total - 1) {
    pages.push('ellipsis');
  }

  pages.push(total);

  return pages;
};

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const handleChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  // Caso de página única: solo mostrar indicador
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between border border-gray-200 px-4 py-3 bg-white shadow-sm">
        <div className="text-sm text-gray-600">
          Page 1 of 1
        </div>
      </div>
    );
  }

  const pages = getPageNumbers(currentPage, totalPages);

  const navBtn = 'h-10 px-4 flex items-center justify-center border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white';
  const pageBtnBase = 'w-10 h-10 flex items-center justify-center text-sm border';
  const pageBtn = `${pageBtnBase} border-gray-300 text-gray-700 hover:bg-gray-50`;
  const pageBtnActive = `${pageBtnBase} bg-black text-white border-black`;

  return (
    <div className="flex items-center justify-between border border-gray-200 px-4 py-3 bg-white shadow-sm">
      {/* Elemento Izquierdo - Indicador de Página */}
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>

      {/* Elemento Derecho - Controles Agrupados */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          type="button"
          className={navBtn}
          onClick={() => handleChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {/* Números de Página */}
        {pages.map((page, idx) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-500">...</span>
          ) : (
            <button
              key={page}
              type="button"
              className={page === currentPage ? pageBtnActive : pageBtn}
              onClick={() => handleChange(page)}
            >
              {page}
            </button>
          )
        ))}

        {/* Next Button */}
        <button
          type="button"
          className={navBtn}
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
