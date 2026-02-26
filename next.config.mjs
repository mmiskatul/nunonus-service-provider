const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
        pathname: "/api/mcp/asset/**"
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**"
      }
    ]
  }
};

export default nextConfig;
