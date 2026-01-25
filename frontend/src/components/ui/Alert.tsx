import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const Alert = ({ type, title, children, onClose }: AlertProps) => {
  // Define styles based on alert type
  const styles = {
    success: {
      container: 'bg-green-50 border border-green-300',
      text: 'text-green-800',
      title: 'text-green-900 font-bold',
      icon: '✓',
      iconColor: 'text-green-600',
    },
    error: {
      container: 'bg-red-50 border border-red-300',
      text: 'text-red-800',
      title: 'text-red-900 font-bold',
      icon: '✕',
      iconColor: 'text-red-600',
    },
    warning: {
      container: 'bg-yellow-50 border border-amber-300',
      text: 'text-amber-800',
      title: 'text-amber-900 font-bold',
      icon: '⚠',
      iconColor: 'text-amber-600',
    },
    info: {
      container: 'bg-blue-50 border border-blue-300',
      text: 'text-blue-800',
      title: 'text-blue-900 font-bold',
      icon: 'ℹ',
      iconColor: 'text-blue-600',
    },
  };

  const currentStyle = styles[type];

  return (
    <div className={`${currentStyle.container} rounded-none p-4 flex gap-4 items-start`}>
      {/* Icon */}
      <div className={`${currentStyle.iconColor} text-xl font-bold flex-shrink-0 mt-0.5`}>
        {currentStyle.icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        {title && <div className={`${currentStyle.title} mb-1`}>{title}</div>}
        <div className={`${currentStyle.text} text-sm`}>{children}</div>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className={`${currentStyle.iconColor} hover:opacity-75 flex-shrink-0 mt-0.5 text-lg font-bold transition-opacity`}
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
