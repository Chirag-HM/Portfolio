import { useEffect } from 'react'
import { siteConfig } from '../data/config'
import { applyRouteSeo } from '../lib/seo'
import { HeroSection } from '../sections/HeroSection'
import { MarqueeSection } from '../sections/MarqueeSection'
import { AboutSection } from '../sections/AboutSection'
import { ServicesSection } from '../sections/ServicesSection'
import { StackSection } from '../sections/StackSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { ContactSection } from '../sections/ContactSection'

export interface HomePageProps {
  onOpenContact: () => void
}

export function HomePage({ onOpenContact }: HomePageProps) {
  useEffect(() => {
    applyRouteSeo({
      title: `${siteConfig.name} — Full-Stack & AI Developer`,
      description: siteConfig.aboutParagraph,
      pathname: '/',
    })
  }, [])

  return (
    <>
      <HeroSection onOpenContact={onOpenContact} />
      <MarqueeSection />
      <AboutSection onOpenContact={onOpenContact} />
      <ServicesSection />
      <StackSection />
      <ProjectsSection />
      <ContactSection onOpenContact={onOpenContact} />
    </>
  )
}
