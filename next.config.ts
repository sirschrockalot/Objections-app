import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Request size limits to prevent DoS attacks
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
  // Mark server-only packages as external (prevents bundling in client)
  serverExternalPackages: [
    'mongoose',
    'mongodb',
    'node-cache',
  ],
  // Prevent server-only modules from being bundled in client (webpack fallback)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        'async_hooks': false,
      };
      
      // Ignore mongoose and related server-only packages in client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'mongoose': 'commonjs mongoose',
        'mongodb': 'commonjs mongodb',
        'node-cache': 'commonjs node-cache',
      });
    }
    return config;
  },
  // CORS configuration
  async rewrites() {
    return [];
  },
  // PWA support and security headers
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed for Next.js, unsafe-inline for inline scripts
              "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Next.js styles
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
