/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gsoc-decision-ops/core'],
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle Transformers.js / ONNX Runtime for browser-only usage
    if (!isServer) {
      // Exclude Node.js native modules from browser bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Handle ONNX Runtime WASM files
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
      };
    }

    // Mark onnxruntime-node as external to avoid bundling
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push('onnxruntime-node');
    }

    return config;
  },
};

module.exports = nextConfig;
