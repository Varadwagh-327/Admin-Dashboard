import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
  
    domains: ["res.cloudinary.com"], 
  
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdni.iconscout.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'beglam.superbstore.in',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
