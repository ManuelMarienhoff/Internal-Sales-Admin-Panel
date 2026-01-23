import React from 'react';

export interface ColumnDef<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  emptyMessage?: string;
}

const Table = <T extends { id?: number }>({
  data,
  columns,
  emptyMessage = 'No data found',
}: TableProps<T>) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-300">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="bg-pwc-orange">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 text-left text-pwc-black font-bold ${
                  idx < columns.length - 1 ? 'border-r border-white' : ''
                } ${column.width || ''}`}
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
              className={`${
                rowIndex % 2 === 0 ? 'bg-white' : 'bg-orange-50'
              } border-b border-gray-300 hover:bg-orange-100 transition-colors`}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 text-pwc-black">
                  {column.render
                    ? column.render(row, rowIndex)
                    : column.accessor
                    ? String(row[column.accessor] || '-')
                    : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
