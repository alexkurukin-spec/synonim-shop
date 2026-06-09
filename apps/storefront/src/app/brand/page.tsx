import { Metadata } from "next"
import Logo from "@modules/common/components/logo"

export const metadata: Metadata = {
  title: "СИНОНИМ — бренд-система",
  description: "Палитра, типографика и логотип бренда СИНОНИМ.",
}

const swatches: { name: string; token: string; hex: string; note: string }[] = [
  { name: "Оливковый", token: "brand", hex: "#73A341", note: "лого, акценты" },
  { name: "Тёмный оливковый", token: "brand-dark", hex: "#4A5335", note: "CTA, текст, хедер/футер" },
  { name: "Терракотовый", token: "accent", hex: "#D47750", note: "детали, hover, бейджи" },
  { name: "Терракотовый тёмный", token: "accent-deep", hex: "#C96A4A", note: "акцент на светлом" },
  { name: "Песочный", token: "sand", hex: "#E8D9B5", note: "подложки, секции" },
  { name: "Фон", token: "bg", hex: "#FBF8F1", note: "фон страниц" },
  { name: "Поверхность", token: "surface", hex: "#FFFFFF", note: "карточки, инпуты" },
  { name: "Текст", token: "ink", hex: "#1A1A1A", note: "основной текст" },
]

/**
 * Backend-independent brand showcase / living style guide.
 * Verifies brand theme + fonts render without a running Medusa backend.
 * Excluded from region middleware (see middleware.ts matcher).
 */
export default function BrandPage() {
  return (
    <div className="min-h-screen bg-bg px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        <header className="flex flex-col gap-6">
          <Logo variant="color" width={220} height={50} priority />
          <h1 className="font-display text-5xl font-bold text-brand-dark">
            Бренд-система СИНОНИМ
          </h1>
          <p className="max-w-2xl font-body text-lg text-ink/80">
            Серебро с выращенными бриллиантами. Современная демократичная ювелирка,
            эко-технологичность с женственным акцентом. Эта страница — проверка
            брендовой темы и шрифтов (Фаза 0).
          </p>
        </header>

        <section className="flex flex-col gap-6">
          <h2 className="font-display text-3xl font-semibold text-brand-dark">
            Палитра
          </h2>
          <div className="grid grid-cols-2 gap-4 small:grid-cols-4">
            {swatches.map((s) => (
              <div
                key={s.token}
                className="overflow-hidden rounded-rounded border border-sand bg-surface shadow-sm"
              >
                <div className="h-20 w-full" style={{ backgroundColor: s.hex }} />
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="font-body text-sm font-medium text-ink">
                    {s.name}
                  </span>
                  <code className="font-body text-xs text-ink/60">{s.hex}</code>
                  <span className="font-body text-xs text-ink/50">{s.note}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-display text-3xl font-semibold text-brand-dark">
            Типографика
          </h2>
          <div className="flex flex-col gap-3 rounded-rounded border border-sand bg-surface p-8">
            <p className="font-body text-xs uppercase tracking-widest text-accent-deep">
              Playfair Display — заголовки
            </p>
            <p className="font-display text-5xl font-bold text-brand-dark">
              Выращенные бриллианты
            </p>
            <p className="font-display text-2xl font-normal text-ink">
              Кольца · Серьги · Подвески · Браслеты
            </p>
            <hr className="my-4 border-sand" />
            <p className="font-body text-xs uppercase tracking-widest text-accent-deep">
              Inter — основной текст
            </p>
            <p className="max-w-2xl font-body text-base text-ink/80">
              Эстетика refined/minimal с премиальной доступностью. Оба шрифта
              поддерживают кириллицу (subsets latin + cyrillic, display: swap).
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-display text-3xl font-semibold text-brand-dark">
            Кнопки (доступность WCAG AA)
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <button className="rounded-base bg-brand-dark px-7 py-3 font-body text-sm font-medium text-white transition-colors hover:bg-brand">
              Основная CTA (brand-dark + белый)
            </button>
            <button className="rounded-base bg-accent px-7 py-3 font-body text-sm font-medium text-ink transition-colors hover:bg-accent-deep hover:text-white">
              Акцент (accent + тёмный текст)
            </button>
            <button className="rounded-base border border-brand-dark px-7 py-3 font-body text-sm font-medium text-brand-dark transition-colors hover:bg-brand-dark hover:text-white">
              Вторичная
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-display text-3xl font-semibold text-brand-dark">
            Логотип
          </h2>
          <div className="grid grid-cols-1 gap-4 small:grid-cols-3">
            <div className="flex items-center justify-center rounded-rounded border border-sand bg-surface p-8">
              <Logo variant="color" width={180} height={40} />
            </div>
            <div className="flex items-center justify-center rounded-rounded border border-sand bg-bg p-8">
              <Logo variant="black" width={180} height={40} />
            </div>
            <div className="flex items-center justify-center rounded-rounded bg-brand-dark p-8">
              <Logo variant="white" width={180} height={40} />
            </div>
          </div>
          <p className="font-body text-sm text-ink/60">
            Заглушки в <code>/public/logo/</code> — заменить на финальные SVG
            (цветной / чёрный / белый).
          </p>
        </section>
      </div>
    </div>
  )
}
