export default function Button({ children, onClick, disabled, variant = 'primary', className = '', type = 'button' }) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50',
    success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-yellow-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
