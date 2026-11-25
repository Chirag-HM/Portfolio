import { siteConfig } from '../data/config'
import { FadeIn } from '../components/FadeIn'

export function ServicesSection() {
  return (
    <section
      id="services"
      className="relative rounded-t-[40px] bg-white px-5 py-20 pb-28 sm:rounded-t-[50px] sm:px-8 sm:py-24 sm:pb-36 md:rounded-t-[60px] md:px-10 md:py-32 md:pb-44"
    >
      <FadeIn delay={0} y={40}>
        <h2
          className="mb-16 text-center font-black uppercase leading-none tracking-tight text-[#0C0C0C] sm:mb-20 md:mb-28"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          {siteConfig.servicesHeading}
        </h2>
      </FadeIn>

      <div className="mx-auto max-w-5xl">
        {siteConfig.services.map((service, i) => (
          <FadeIn
            key={service.number}
            delay={i * 0.1}
            y={30}
            className="border-t border-[rgba(12,12,12,0.15)] last:border-b"
          >
            <div className="flex items-start gap-6 py-8 sm:gap-10 sm:py-10 md:gap-14 md:py-12">
              <span
                className="shrink-0 font-black leading-none text-[#0C0C0C]"
                style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}
              >
                {service.number}
              </span>

              <div className="flex flex-col gap-2 pt-1 sm:gap-3 sm:pt-2">
                <h3
                  className="font-medium uppercase text-[#0C0C0C]"
                  style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}
                >
                  {service.name}
                </h3>
                <p
                  className="max-w-2xl font-light leading-relaxed text-[#0C0C0C] opacity-60"
                  style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.25rem)' }}
                >
                  {service.description}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
