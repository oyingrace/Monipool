import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', '@breeztech/breez-sdk-liquid'],
}

export default nextConfig
