/**
 * Рендерит блок JSON-LD (schema.org) в виде <script type="application/ld+json">.
 * Используется для Product/Offer, BreadcrumbList, Organization, WebSite (Фаза 3).
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // structured data — управляемый нами объект, сериализуется безопасно
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
