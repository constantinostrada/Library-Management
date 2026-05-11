import type { Metadata } from 'next';

export const metadata: Metadata = { title: '404 — Not Found' };

/**
 * Custom 404 page.
 */
export default function NotFound(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <p className="text-8xl font-black text-brand-200">404</p>
      <h1 className="text-2xl font-bold text-gray-800">Page Not Found</h1>
      <p className="text-gray-500 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <a href="/" className="btn-primary mt-4">
        Go Home
      </a>
    </div>
  );
}
