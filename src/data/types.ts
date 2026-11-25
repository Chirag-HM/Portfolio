export type SceneChapterId = 'projects' | 'stack' | 'contact' | 'play'

export interface NavLinkItem {
  label: string
  href: string
  isContact?: boolean
}

export interface ServiceItem {
  number: string
  name: string
  description: string
}

export interface ProjectItem {
  slug: string
  number: string
  title: string
  category: string
  tagline: string
  status: string
  year: string
  stack: string[]
  liveUrl: string
  githubUrl: string
  screenshots: string[]
  problem: string
  built: string
  hard: string
  wouldChange: string
}

export interface SkillItem {
  name: string
  note?: string
}

export interface SkillGroup {
  id: 'frontend' | 'backend' | 'ai' | 'iot'
  label: string
  subtitle: string
  skills: SkillItem[]
}

export interface MomentItem {
  image: string
  caption: string
}

export interface SiteConfig {
  name: string
  shortName: string
  heroGreeting: string
  heroTagline: string
  aboutHeading: string
  aboutParagraph: string
  servicesHeading: string
  stackHeading: string
  projectsHeading: string
  contactHeading: string
  email: string
  githubUrl: string
  linkedInUrl: string
  statusText: string
  resumeUrl: string
  portraitUrl: string
  signatureUrl: string
  navLinks: NavLinkItem[]
  services: ServiceItem[]
}
