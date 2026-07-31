/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
const isPublicApiUrl = apiUrl && /^https?:\/\//.test(apiUrl);

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Railway's *.railway.internal host is private to Railway and cannot be
    // used by Vercel. Skip the proxy unless a public HTTP(S) API URL is set.
    return isPublicApiUrl ? [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ] : [];
  },
  // SEC-008 FIX: Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
