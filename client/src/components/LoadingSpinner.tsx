import { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner = memo(({ size = 'md', text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-border animate-spin"
             style={{ 
               background: 'conic-gradient(from 0deg, transparent, #3b82f6, #8b5cf6, transparent)',
               WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
               mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))'
             }}>
        </div>
        
        {/* Inner pulse dot */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
      </div>
      
      {text && (
        <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';