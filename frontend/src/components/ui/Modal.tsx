import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      {/* Modal Container */}
      <div className="bg-white rounded-none shadow-lg max-w-2xl w-full mx-4 z-50">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-300">
          <h2 className="text-3xl font-serif font-bold text-pwc-black">
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {children}
        </div>

        {/* Close Button (Optional X) */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-700"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Modal;
