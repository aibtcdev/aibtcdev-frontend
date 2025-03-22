// @ts-check
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Force bundling of stacks/transactions package
    config.externals = [...(config.externals || [])].filter(
      (external) =>
        typeof external !== "function" ||
        !external.toString().includes("@stacks/transactions")
    );
    return config;
  },
};

export default nextConfig;
