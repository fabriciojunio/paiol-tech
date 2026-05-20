import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@paiol/ui', '@paiol/types', '@paiol/utils'],
};

export default nextConfig;
