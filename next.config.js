/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/@vercel/postgres/**/*'],
    },
  },
  };


module.exports = nextConfig;
