import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'http://localhost:4000',
  integrations: [
    starlight({
      title: 'Autharis Docs',
      description:
        'Official documentation for the Autharis remote hourly talent marketplace ecosystem.',
      logo: {
        src: './public/favicon.svg',
        alt: 'Autharis',
      },
      social: {
        github: 'https://github.com/autharis/autharis',
      },
      editLink: {
        baseUrl:
          'https://github.com/autharis/autharis/edit/main/apps/docs/',
      },
      sidebar: [
        {
          label: 'Overview',
          items: [
            { label: 'What is Autharis', link: '/overview/platform/' },
            { label: 'Roles', link: '/overview/roles/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Matching model', link: '/guides/matching/' },
            { label: 'Payments & payouts', link: '/guides/payments/' },
          ],
        },
        {
          label: 'API',
          items: [
            { label: 'HTTP reference', link: '/api/reference/' },
            { label: 'TypeScript SDK', link: '/api/sdk/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'FAQ', link: '/faq/' },
            { label: 'Glossary', link: '/glossary/' },
            { label: 'Swarm process', link: '/swarm/' },
          ],
        },
      ],
    }),
  ],
});
