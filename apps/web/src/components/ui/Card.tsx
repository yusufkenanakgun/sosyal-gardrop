import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const hoverClass = hover ? 'hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5' : '';

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg transition-all duration-200 ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 border-b border-gray-200 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 border-t border-gray-200 ${className}`}>{children}</div>;
}
