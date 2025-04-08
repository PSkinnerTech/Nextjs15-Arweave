import { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // output: 'export',
  reactStrictMode: false,
  webpack: (config) => {
    // Basic polyfills for browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
    };

    // TODO: @dha-team/arbundles uses "$/utils" alias internally, but does not resolve correctly when consumed, add this alias to avoid webpack build errors (e.g. when running `next build`) until the package is updated
    config.resolve.alias["$/utils"] = path.resolve(
      __dirname,
      "node_modules/@dha-team/arbundles/build/web/esm/src/webUtils.js"
    );

    // TODO: @noble/ed25519 uses `import * as nodeCrypto from 'node:crypto'` internally, but does not resolve correctly when consumed client side; add this alias to avoid webpack build errors (e.g. when running `next build`) until the package is updated
    config.resolve.alias["@noble/ed25519"] = path.resolve(
      __dirname,
      "node_modules/@noble/ed25519/lib/index.js"
    );

    return config;
  },
  experimental: {
    turbo: {
      resolveAlias: {
        buffer: 'buffer',
        process: 'process/browser',
        fs: 'browserify-fs',
        // strictly use web version of arbundles package when running in turbopack
        '@dha-team/arbundles': "./node_modules/@dha-team/arbundles/build/web/esm/webIndex.js",
        // TODO: @dha-team/arbundles uses "$/utils" alias internally, but does not resolve correctly when consumed, add this alias to avoid turbopack build errors (e.g. when running `next start --turbopack`) until the package is updated
        "$/utils": "./node_modules/@dha-team/arbundles/build/web/esm/src/webUtils.js",
        // TODO: @noble/ed25519 uses "crypto" internally, but the way it is imported via esm does not work with turbopack, add this alias to avoid turbopack build errors (e.g. when running `next start --turbopack`) until the package is updated
        '@noble/ed25519': "./node_modules/@noble/ed25519/lib/index.js",
      },
    },
  },
};

export default nextConfig;
