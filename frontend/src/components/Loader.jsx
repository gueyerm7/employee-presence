export default function Loader({ size = 'md' }) {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600`} />
    </div>
  );
}
