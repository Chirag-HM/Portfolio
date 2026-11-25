import type { SiteConfig } from './types'

/**
 * Primary production site URL for canonical links, sitemaps, robots.txt, and Open Graph metadata.
 * Everything in the build pipeline, SEO meta tags, and structured data reads from this constant.
 */
export const SITE_URL = 'https://chiragportfolio-mu.vercel.app'

export const siteConfig: SiteConfig = {
  name: 'Chirag H M',
  shortName: 'Chirag',
  heroGreeting: "Hi, i'm chirag h m",
  heroTagline: 'a full-stack developer building ai apps, iot systems & tools',
  aboutHeading: 'About me',
  aboutParagraph:
    'Engineering student at VTU and full-stack developer who builds AI-integrated apps, IoT systems and automation tools, and likes getting the most out of free-tier APIs.',
  servicesHeading: 'Services',
  stackHeading: 'Stack',
  projectsHeading: 'Projects',
  contactHeading: 'Contact',

  // Leave empty until ready — any empty value is hidden automatically from the UI
  email: 'chiraghm06@gmail.com',
  githubUrl: '',
  linkedInUrl: '',
  statusText: '',

  // Local public/ assets (automatically shown when the file exists in public/, hidden otherwise)
  resumeUrl: '/resume.pdf',
  portraitUrl: '/me/cutout.png',
  signatureUrl: '/signature.svg',

  // /play is intentionally excluded from nav until its 3D world is built
  navLinks: [
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Stack', href: '#stack' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact', isContact: true },
  ],

  services: [
    {
      number: '01',
      name: 'Full-Stack Web',
      description:
        'End-to-end web applications built with React, TypeScript, Node.js, Express, FastAPI, and MongoDB for reliable workflows.',
    },
    {
      number: '02',
      name: 'AI Integration',
      description:
        'Practical LLM pipelines, vision assistance, and study helpers designed to ship cleanly on free-tier APIs.',
    },
    {
      number: '03',
      name: 'IoT Systems',
      description:
        'Connected edge hardware and networked telemetry pairing Raspberry Pi devices with live web dashboards.',
    },
    {
      number: '04',
      name: 'Automation Tools',
      description:
        'Focused browser extensions and developer utilities that capture context and speed up everyday engineering tasks.',
    },
    {
      number: '05',
      name: 'Interactive UI',
      description:
        'Responsive interfaces with crisp typography, thoughtful motion choreography, and accessible layout structure.',
    },
  ],
}
