import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Strict mode enables additional React development warnings.
   * Recommended for all new projects.
   */
  reactStrictMode: true,

  /**
   * Expose only explicitly allow-listed environment variables to the browser.
   * Server-only variables (DATABASE_URL, etc.) are NOT listed here on purpose.
   */
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
