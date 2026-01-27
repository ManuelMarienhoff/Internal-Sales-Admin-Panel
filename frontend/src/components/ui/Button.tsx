import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const Button = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'px-8 py-4 text-base font-bold transition-colors';
  
  const variantStyles = {
    primary: 'bg-pwc-orange text-pwc-black hover:bg-pwc-black hover:text-white',
    secondary: 'bg-white border border-pwc-black text-pwc-black hover:bg-gray-100',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
