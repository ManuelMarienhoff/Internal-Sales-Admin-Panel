import { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

interface SearchBarProps {
  placeholder: string;
  onSearch: (value: string) => void;
  initialValue?: string;
}

const SearchBar = ({ placeholder, onSearch, initialValue = '' }: SearchBarProps) => {
  const [value, setValue] = useState(initialValue);
  const isFirstRender = useRef(true);

  // Debounce implementation
  useEffect(() => {
    // Skip the very first render when the value is empty to avoid unnecessary search
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!value) return undefined;
    }

    const timer = setTimeout(() => {
      onSearch(value);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pwc-orange focus:ring-2 focus:ring-pwc-orange transition-colors"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
