import type { SkillGroup } from './types'

export const skillGroups: SkillGroup[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    subtitle: 'Full Stack Development (BIS601)',
    skills: [
      { name: 'React', note: 'Primary UI library across portfolio and AI platforms' },
      { name: 'TypeScript', note: 'Strict typed components, data schemas, and browser tools' },
      { name: 'Tailwind CSS', note: 'Utility-first layout and responsive design tokens' },
      { name: 'Framer Motion', note: 'Scroll-linked reveals and layout transitions' },
      { name: 'Three.js', note: '3D platform visualization for AI Smart Vision' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    subtitle: 'APIs & Data Layer',
    skills: [
      { name: 'Node.js', note: 'REST services and backend automation scripts' },
      { name: 'Express', note: 'Routing and middleware for MERN applications' },
      { name: 'FastAPI', note: 'Python backend bridging Raspberry Pi 4 & web clients' },
      { name: 'MongoDB Atlas', note: 'Document persistence for placement and vision workflows' },
    ],
  },
  {
    id: 'ai',
    label: 'AI & APIs',
    subtitle: 'Practical Free-Tier Orchestration',
    skills: [
      { name: 'Google Gemini', note: 'Resume analysis and structured interview prep prompts' },
      { name: 'Adzuna API', note: 'Live role feeds matched against student profiles' },
      { name: 'Browser Extensions', note: 'Screen-capture triggers for step-by-step DSA hints' },
      { name: 'Free-Tier Optimization', note: 'Routing & prompt discipline to stretch API quotas' },
    ],
  },
  {
    id: 'iot',
    label: 'IoT',
    subtitle: 'IoT Networking (BIS613B)',
    skills: [
      { name: 'Raspberry Pi 4', note: 'Edge compute unit powering the AI Smart Vision stick' },
      { name: 'IoT Networking', note: 'Sensor-to-cloud telemetry and device communication (BIS613B)' },
      { name: 'Assistive Hardware', note: 'Real-time spatial feedback paired with 3D web monitoring' },
    ],
  },
]
