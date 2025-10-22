import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // Sharp needs to be external package for Vercel
  serverExternalPackages: ['sharp'],
};

export default withNextIntl(nextConfig);
