import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // Increase body size limit for image uploads (in bytes)
  serverRuntimeConfig: {
    bodySizeLimit: '10mb',
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default withNextIntl(nextConfig);
