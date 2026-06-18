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
};

export default nextConfig;
