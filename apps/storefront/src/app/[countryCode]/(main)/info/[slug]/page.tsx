import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLegalPage } from "@lib/constants/legal"

type Props = {
  params: Promise<{ slug: string; countryCode: string }>
}

// Страницы рендерятся динамически: родительский layout (main) и так зависит
// от cookie. generateStaticParams здесь не задаём намеренно — частичный набор
// params (slug без countryCode) ломал статический пререндер в проде.

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, countryCode } = await props.params
  const page = getLegalPage(slug)
  if (!page) {
    notFound()
  }
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${countryCode}/info/${page.slug}` },
  }
}

export default async function LegalInfoPage(props: Props) {
  const { slug } = await props.params
  const page = getLegalPage(slug)
  if (!page) {
    notFound()
  }

  return (
    <div className="content-container py-12 max-w-3xl" data-testid="legal-page">
      <h1 className="text-3xl-semi mb-8" data-testid="legal-title">
        {page.title}
      </h1>
      <div className="flex flex-col gap-y-8 text-base-regular text-ui-fg-subtle">
        {page.sections.map((section, i) => (
          <section key={i} className="flex flex-col gap-y-3">
            {section.heading && (
              <h2 className="text-xl-semi text-ui-fg-base">
                {section.heading}
              </h2>
            )}
            {section.paragraphs.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
