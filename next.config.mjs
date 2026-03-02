/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "www.bundestag.de",
      },
      {
        protocol: "https",
        hostname: "www.congress.gov",
      },
      {
        protocol: 'https',
        hostname: 'unitedstates.github.io',
        pathname: '/images/**'
      },
      {
        protocol: 'https',
        hostname: 'bioguide.congress.gov',
        pathname: '/bioguide/photo/**'
      },
      {
        protocol: 'https',
        hostname: 'www.spdfraktion.de'
      },
      {
        protocol: 'https',
        hostname: 'www.landtag-niedersachsen.de'
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com"
      },
      {
        protocol: "https",
        hostname: "abs.twimg.com"
      },
      {
        protocol: "https",
        hostname: "platform.twitter.com"
      }
    ]
  }
};

export default nextConfig;
