import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'EtchNFT Documentation',
      description: 'Complete documentation for the EtchNFT platform - Transform your NFTs into physical collectibles.',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: true,
      },
      social: {
        github: 'https://github.com/cozyartz/etchNFT',
        twitter: 'https://twitter.com/EtchNFT',
      },
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/introduction/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Environment Setup', link: '/getting-started/environment/' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'Overview', link: '/architecture/overview/' },
            { label: 'Frontend', link: '/architecture/frontend/' },
            { label: 'Backend', link: '/architecture/backend/' },
            { label: 'Database', link: '/architecture/database/' },
            { label: 'Authentication', link: '/architecture/authentication/' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Overview', link: '/api/overview/' },
            { label: 'Authentication', link: '/api/authentication/' },
            { label: 'NFT Endpoints', link: '/api/nfts/' },
            { label: 'Order Management', link: '/api/orders/' },
            { label: 'User Management', link: '/api/users/' },
          ],
        },
        {
          label: 'Development',
          items: [
            { label: 'Development Guide', link: '/development/guide/' },
            { label: 'Testing', link: '/development/testing/' },
            { label: 'Contributing', link: '/development/contributing/' },
            { label: 'Code Standards', link: '/development/standards/' },
          ],
        },
        {
          label: 'Deployment',
          items: [
            { label: 'Cloudflare Workers', link: '/deployment/cloudflare/' },
            { label: 'Environment Variables', link: '/deployment/environment/' },
            { label: 'Database Migrations', link: '/deployment/migrations/' },
            { label: 'Monitoring', link: '/deployment/monitoring/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Adding New NFT Networks', link: '/guides/add-networks/' },
            { label: 'Custom Payment Providers', link: '/guides/payment-providers/' },
            { label: 'Email Templates', link: '/guides/email-templates/' },
            { label: 'Admin Dashboard', link: '/guides/admin-dashboard/' },
          ],
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/cozyartz/etchNFT/edit/main/docs/',
      },
      lastUpdated: true,
      pagination: true,
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
    }),
  ],
  output: 'static',
  outDir: '../dist-docs',
});