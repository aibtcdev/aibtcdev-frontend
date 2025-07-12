// @ts-check
const path = require("path");

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: "custom",
    loaderFile: "./supabase-image-loader.js",
  },
  webpack: (config) => {
    // Extend the default aliases to include "@"
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(__dirname, "src"), // __dirname works in CommonJS
    };
    return config;
  },
};

module.exports = nextConfig;
