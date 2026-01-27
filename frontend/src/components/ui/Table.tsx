import React from 'react';

export interface ColumnDef<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowsPerPage?: number;
}

const Table = <T extends { id?: number }>({
  data,
  columns,
  emptyMessage = 'No data found',
  onRowClick,
  rowsPerPage,
}: TableProps<T>) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        {emptyMessage}
      </div>
    );
  }

  const spacerRows = rowsPerPage ? Math.max(rowsPerPage - data.length, 0) : 0;

  return (
    <div className="h-full overflow-y-auto overflow-x-auto border border-gray-300">
      <table className="w-full border-collapse table-fixed">
        {/* Header - sticky */}
        <thead>
          <tr className="bg-pwc-orange">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 text-left text-pwc-black font-bold sticky top-0 bg-pwc-orange z-10 ${
                  idx < columns.length - 1 ? 'border-r border-white' : ''
                } ${column.width || ''} ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-orange-50'} border-b border-gray-300 hover:bg-orange-200 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <td 
                  key={colIndex} 
                  className="px-6 py-4 text-pwc-black align-middle"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div className="overflow-hidden text-ellipsis">
                    {column.render
                      ? column.render(row, rowIndex)
                      : column.accessor
                      ? String(row[column.accessor] || '-')
                      : '-'}
                  </div>
                </td>
              ))}
            </tr>
          ))}

          {spacerRows > 0 &&
            Array.from({ length: spacerRows }).map((_, idx) => (
              <tr
                key={`spacer-${idx}`}
                className="bg-transparent border-b border-transparent pointer-events-none select-none"
                aria-hidden="true"
              >
                <td colSpan={columns.length} className="px-6 py-4 opacity-0">
                  &nbsp;
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
