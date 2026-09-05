/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gsoc-decision-ops/core'],
  output: 'standalone',
};

module.exports = nextConfig;
