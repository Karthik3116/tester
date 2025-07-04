// frontend/src/components/LoadingSpinner.jsx
import React from 'react';

function LoadingSpinner({ size = 'md' }) {
  let spinnerSizeClasses = '';
  let borderSizeClasses = '';

  switch (size) {
    case 'sm':
      spinnerSizeClasses = 'w-6 h-6';
      borderSizeClasses = 'border-2';
      break;
    case 'md':
      spinnerSizeClasses = 'w-10 h-10';
      borderSizeClasses = 'border-4';
      break;
    case 'lg':
      spinnerSizeClasses = 'w-16 h-16';
      borderSizeClasses = 'border-6';
      break;
    default:
      spinnerSizeClasses = 'w-10 h-10';
      borderSizeClasses = 'border-4';
  }

  return (
    <div className={`inline-block animate-spin rounded-full ${spinnerSizeClasses} ${borderSizeClasses} border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`} role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
    </div>
  );
}

export default LoadingSpinner;
