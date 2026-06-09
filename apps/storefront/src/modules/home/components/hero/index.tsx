import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="relative h-[75vh] w-full border-b border-sand bg-sand/40">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-6 text-center small:px-32">
        <p className="font-body text-sm uppercase tracking-[0.3em] text-accent-deep">
          Серебро с выращенными бриллиантами
        </p>
        <h1 className="font-display text-5xl font-bold leading-tight text-brand-dark small:text-6xl">
          СИНОНИМ
        </h1>
        <p className="max-w-xl font-body text-base text-ink/80">
          Современная ювелирка с лабораторными бриллиантами. Эко-технологичность,
          сертификаты, шоурум.
        </p>
        <LocalizedClientLink
          href="/store"
          className="mt-2 inline-flex items-center rounded-base bg-brand-dark px-7 py-3 font-body text-sm font-medium text-white transition-colors duration-200 hover:bg-brand"
        >
          В каталог
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Hero
