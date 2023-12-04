/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  reactStrictMode: false,
  swcMinify: true,
};

module.exports = nextConfig;
