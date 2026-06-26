/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable Next.js image optimization (was unoptimized before)
    // Allows serving WebP/AVIF and resized images automatically
    unoptimized: false,
    remotePatterns: [
      {
        // Allow images from the same domain (production uploads)
        protocol: 'https',
        hostname: 'promptking.in',
        pathname: '/uploads/**',
      },
      {
        // Allow localhost for development
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/uploads/**',
      },
    ],
    // Cache optimized images for 60 seconds (matches ISR revalidate)
    minimumCacheTTL: 60,
  },
  // Compress responses with gzip
  compress: true,

  // Redirect www to non-www to fix duplicate content SEO issue
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.promptking.in' }],
        destination: 'https://promptking.in/:path*',
        permanent: true, // 301 redirect
      },
    ];
  },

  // Security headers including HSTS to fix Semrush HSTS warning
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // HSTS: Forces HTTPS for 2 years, includes subdomains
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Prevent clickjacking
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Control referrer information
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Permissions policy
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
