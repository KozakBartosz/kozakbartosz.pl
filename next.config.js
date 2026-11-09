const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [{ source: '/quiz', destination: '/quiz/index.html' }];
    }
};

module.exports = (phase) => ({
    ...nextConfig,
    // Production builds must not overwrite a running development server's files.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'
});
