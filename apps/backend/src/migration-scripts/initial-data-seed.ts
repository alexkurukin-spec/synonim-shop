import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * СИНОНИМ — seed данных каталога (Фаза 1).
 *
 * Бренд: серебро 925 + выращенные (лабораторные) бриллианты.
 * Регион: Россия, валюта RUB, локаль ru-RU.
 *
 * Модель вариантов (раздел 2 брифа):
 *   - Размер       (кольца / браслеты)
 *   - Каратность   (вес вставки: 0.1 / 0.2 / 0.3 / 0.5 ct)
 *   - Металл       (серебро 925)
 *
 * Цена задаётся на вариант. Каратность — основной драйвер цены, поэтому у
 * товаров с несколькими значениями каратности появляются варианты с разной
 * ценой → на витрине корректно считается «от {min}».
 *
 * Кастомные поля:
 *   - product.metadata.stone  — тип камня / огранка / цвет / чистота (для JSON-LD и фильтров, Фаза 3)
 *   - product.metadata.metal  — "silver-925"
 *   - variant.metadata.uin    — УИН ГИИС ДМДК (демо-значение).
 *       TODO (Фаза 5): УИН присваивается конкретной физической инвентарной
 *       единице, а не SKU. Реальный пер-айтемный учёт УИН + онлайн-проверка
 *       статуса в ТМ ГИИС ДМДК делается в комплаенс-слое. Здесь — представительная
 *       заглушка на уровне варианта, чтобы заложить поле и наполнить витрину.
 */

const SALES_CHANNEL_NAME = "Основной канал продаж";

// ── Категории навигации (раздел 2 брифа) ────────────────────────────────────
const CATEGORIES = [
  "Кольца",
  "Серьги",
  "Подвески и колье",
  "Браслеты",
  "Помолвочные кольца",
] as const;
type CategoryName = (typeof CATEGORIES)[number];

// ── Опции вариантов ──────────────────────────────────────────────────────────
const OPT_SIZE = "Размер";
const OPT_CARAT = "Каратность";
const OPT_METAL = "Металл";

const METAL_VALUE = "Серебро 925"; // единственная проба на старте

// Надбавка к базовой цене за каратность вставки, в рублях.
// Базовая цена товара соответствует минимальной каратности (0.1 ct → надбавка 0).
const CARAT_PREMIUM_RUB: Record<string, number> = {
  "0.1 ct": 0,
  "0.2 ct": 8_000,
  "0.3 ct": 20_000,
  "0.5 ct": 45_000,
};

type ProductSpec = {
  title: string;
  handle: string;
  category: CategoryName;
  description: string;
  /** Базовая цена в рублях (за минимальную каратность). */
  basePrice: number;
  /** Размеры; пусто — товар без размера (серьги, подвески). */
  sizes?: string[];
  /** Доступные значения каратности. */
  carats: string[];
  /** Огранка камня — для product.metadata.stone (фильтры/JSON-LD). */
  cut: string;
  /** Цвет/чистота — усреднённые характеристики выращенного бриллианта. */
  color?: string;
  clarity?: string;
  /** Префикс артикула, напр. "RING-GRAN". */
  skuPrefix: string;
};

// ── Каталог: 13 демо-SKU по 5 категориям ────────────────────────────────────
const PRODUCTS: ProductSpec[] = [
  // Кольца
  {
    title: "Кольцо «Грань»",
    handle: "ring-gran",
    category: "Кольца",
    description:
      "Минималистичное кольцо из серебра 925 с выращенным бриллиантом круглой огранки. Чистая геометрия и мягкий блеск камня.",
    basePrice: 19_900,
    sizes: ["15", "16", "17", "18"],
    carats: ["0.1 ct", "0.2 ct"],
    cut: "round",
    skuPrefix: "RING-GRAN",
  },
  {
    title: "Кольцо «Лента»",
    handle: "ring-lenta",
    category: "Кольца",
    description:
      "Тонкое кольцо-дорожка с россыпью выращенных бриллиантов. Лёгкое на каждый день, выразительное в комплекте.",
    basePrice: 22_400,
    sizes: ["15", "16", "17", "18", "19"],
    carats: ["0.1 ct"],
    cut: "round",
    skuPrefix: "RING-LENTA",
  },
  {
    title: "Кольцо «Капля»",
    handle: "ring-kaplya",
    category: "Кольца",
    description:
      "Кольцо с выращенным бриллиантом огранки «груша». Женственная форма, заметный камень.",
    basePrice: 26_900,
    sizes: ["16", "17", "18"],
    carats: ["0.2 ct", "0.3 ct"],
    cut: "pear",
    skuPrefix: "RING-KAPLYA",
  },

  // Серьги (без размера)
  {
    title: "Серьги-пусеты «Капля света»",
    handle: "earrings-kaplya-sveta",
    category: "Серьги",
    description:
      "Классические пусеты с выращенными бриллиантами круглой огранки. База, которая идёт ко всему.",
    basePrice: 17_900,
    carats: ["0.1 ct", "0.2 ct"],
    cut: "round",
    skuPrefix: "EAR-KSVET",
  },
  {
    title: "Серьги «Дорожка»",
    handle: "earrings-dorozhka",
    category: "Серьги",
    description:
      "Серьги-протяжки с россыпью выращенных бриллиантов вдоль линии уха. Деликатный блеск и современная форма.",
    basePrice: 23_400,
    carats: ["0.1 ct"],
    cut: "round",
    skuPrefix: "EAR-DOROG",
  },
  {
    title: "Серьги-конго «Орбита»",
    handle: "earrings-orbita",
    category: "Серьги",
    description:
      "Серьги-кольца из серебра 925 с дорожкой выращенных бриллиантов. Мотив круга — отсылка к огранке камня в логотипе бренда.",
    basePrice: 28_900,
    carats: ["0.2 ct"],
    cut: "round",
    skuPrefix: "EAR-ORBIT",
  },

  // Подвески и колье (без размера)
  {
    title: "Подвеска «О»",
    handle: "pendant-o",
    category: "Подвески и колье",
    description:
      "Подвеска-кружок с выращенным бриллиантом — фирменный знак «О» бренда как круглая огранка камня. На цепочке-якоре 40–45 см.",
    basePrice: 18_900,
    carats: ["0.1 ct", "0.2 ct"],
    cut: "round",
    skuPrefix: "PEND-O",
  },
  {
    title: "Колье «Капля росы»",
    handle: "necklace-kaplya-rosy",
    category: "Подвески и колье",
    description:
      "Колье с подвеской-каплей и выращенным бриллиантом. Тонкая цепочка, чистый силуэт.",
    basePrice: 24_900,
    carats: ["0.2 ct", "0.3 ct"],
    cut: "pear",
    skuPrefix: "NECK-ROSY",
  },
  {
    title: "Подвеска «Звезда»",
    handle: "pendant-zvezda",
    category: "Подвески и колье",
    description:
      "Подвеска-звезда с выращенным бриллиантом в центре. Лёгкая, для слоистых образов.",
    basePrice: 16_900,
    carats: ["0.1 ct"],
    cut: "round",
    skuPrefix: "PEND-STAR",
  },

  // Браслеты (размер = длина в см)
  {
    title: "Браслет «Нить»",
    handle: "bracelet-nit",
    category: "Браслеты",
    description:
      "Тонкий браслет-цепочка из серебра 925 с выращенным бриллиантом. Незаметный акцент на запястье.",
    basePrice: 20_900,
    sizes: ["16", "17", "18"],
    carats: ["0.1 ct"],
    cut: "round",
    skuPrefix: "BRAC-NIT",
  },
  {
    title: "Браслет-теннис «Линия»",
    handle: "bracelet-liniya",
    category: "Браслеты",
    description:
      "Теннисный браслет с непрерывной дорожкой выращенных бриллиантов. Главное украшение в образе.",
    basePrice: 49_900,
    sizes: ["17", "18", "19"],
    carats: ["0.2 ct", "0.3 ct"],
    cut: "round",
    skuPrefix: "BRAC-LINE",
  },

  // Помолвочные кольца (широкий диапазон каратности → широкий диапазон цены)
  {
    title: "Помолвочное кольцо «Соло»",
    handle: "engagement-solo",
    category: "Помолвочные кольца",
    description:
      "Классическое помолвочное кольцо-солитер с выращенным бриллиантом круглой огранки. Лаконичная посадка камня подчёркивает его чистоту.",
    basePrice: 39_900,
    sizes: ["15", "16", "17", "18"],
    carats: ["0.2 ct", "0.3 ct", "0.5 ct"],
    cut: "round",
    color: "F",
    clarity: "VS1",
    skuPrefix: "ENG-SOLO",
  },
  {
    title: "Помолвочное кольцо «Ореол»",
    handle: "engagement-oreol",
    category: "Помолвочные кольца",
    description:
      "Помолвочное кольцо с центральным выращенным бриллиантом в обрамлении паве. Ореол визуально увеличивает камень.",
    basePrice: 47_900,
    sizes: ["16", "17", "18"],
    carats: ["0.3 ct", "0.5 ct"],
    cut: "round",
    color: "E",
    clarity: "VVS2",
    skuPrefix: "ENG-OREOL",
  },
];

/** Декартово произведение опций товара → список вариантов. */
function buildVariants(
  spec: ProductSpec,
  salesChannelId: string
) {
  const sizes = spec.sizes ?? [undefined];
  const variants: any[] = [];
  let uinSeq = 1;

  for (const size of sizes) {
    for (const carat of spec.carats) {
      const price = spec.basePrice + (CARAT_PREMIUM_RUB[carat] ?? 0);
      const titleParts = [
        size ? `р.${size}` : null,
        carat,
        METAL_VALUE,
      ].filter(Boolean);

      const skuParts = [
        spec.skuPrefix,
        size ?? null,
        carat.replace(/[^0-9]/g, "").padStart(2, "0"), // "0.2 ct" → "02"
      ].filter(Boolean);
      const sku = skuParts.join("-");

      const options: Record<string, string> = {
        [OPT_CARAT]: carat,
        [OPT_METAL]: METAL_VALUE,
      };
      if (size) {
        options[OPT_SIZE] = size;
      }

      variants.push({
        title: titleParts.join(" / "),
        sku,
        options,
        // Демо-УИН на уровне варианта. См. шапку файла — реальный учёт в Фазе 5.
        metadata: {
          uin: `DEMO-UIN-${spec.skuPrefix}-${String(uinSeq++).padStart(4, "0")}`,
          stone_weight_ct: parseFloat(carat),
        },
        prices: [{ amount: price, currency_code: "rub" }],
      });
    }
  }

  return { variants, salesChannelId };
}

/** Сборка опций товара в порядке Размер → Каратность → Металл. */
function buildOptions(spec: ProductSpec) {
  const options: { title: string; values: string[] }[] = [];
  if (spec.sizes?.length) {
    options.push({ title: OPT_SIZE, values: spec.sizes });
  }
  options.push({ title: OPT_CARAT, values: spec.carats });
  options.push({ title: OPT_METAL, values: [METAL_VALUE] });
  return options;
}

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = ["ru"];

  logger.info("СИНОНИМ · Seeding store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: SALES_CHANNEL_NAME,
          description: "Канал продаж интернет-магазина СИНОНИМ",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Storefront Publishable Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "СИНОНИМ",
          supported_currencies: [
            {
              currency_code: "rub",
              is_default: true,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("СИНОНИМ · Seeding region (RUB / Россия)...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Россия",
          currency_code: "rub",
          countries,
          // Заглушка платёжного провайдера. Реальный РФ-эквайринг — Фаза 4.
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("СИНОНИМ · Finished seeding regions.");

  logger.info("СИНОНИМ · Seeding tax region...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
      // TODO (владелец): подтвердить ставку. Для ювелирки в РФ обычно НДС 20%.
      // Пока 0%, чтобы демо-цены отображались как заданы. Значение уточняется.
      default_tax_rate: {
        name: "НДС (TODO: уточнить ставку)",
        rate: 0,
        code: "VAT",
      },
    })),
  });
  logger.info("СИНОНИМ · Finished seeding tax region.");

  logger.info("СИНОНИМ · Seeding stock location...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Шоурум Москва",
          address: {
            city: "Москва",
            country_code: "RU",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("СИНОНИМ · Seeding fulfillment data...");
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Доставка по России",
    type: "shipping",
    service_zones: [
      {
        name: "Россия",
        geo_zones: [{ country_code: "ru", type: "country" }],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Курьер по Москве",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Курьер",
          description: "Доставка курьером по Москве, 1–2 дня.",
          code: "courier-msk",
        },
        prices: [{ region_id: region.id, amount: 500 }],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
      {
        name: "СДЭК / Почта России",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "По России",
          description: "Доставка по России, 3–7 дней.",
          code: "russia-post",
        },
        prices: [{ region_id: region.id, amount: 600 }],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });
  logger.info("СИНОНИМ · Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("СИНОНИМ · Finished seeding stock location data.");

  logger.info("СИНОНИМ · Seeding categories...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: CATEGORIES.map((name) => ({
        name,
        is_active: true,
      })),
    },
  });
  const categoryByName = new Map(categoryResult.map((c) => [c.name, c.id]));

  logger.info("СИНОНИМ · Seeding products...");
  await createProductsWorkflow(container).run({
    input: {
      products: PRODUCTS.map((spec) => {
        const { variants } = buildVariants(spec, defaultSalesChannel.id);
        return {
          title: spec.title,
          handle: spec.handle,
          description: spec.description,
          category_ids: [categoryByName.get(spec.category)!],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          weight: 10,
          // TODO (владелец): фото изделий заливаются позже (раздел 4 брифа).
          options: buildOptions(spec),
          variants,
          // Кастомные поля каталога (раздел 2 брифа).
          metadata: {
            metal: "silver-925",
            stone: {
              type: "lab-grown-diamond",
              cut: spec.cut,
              color: spec.color ?? "G",
              clarity: spec.clarity ?? "VS2",
            },
          },
          sales_channels: [{ id: defaultSalesChannel.id }],
        };
      }),
    },
  });
  logger.info(`СИНОНИМ · Finished seeding ${PRODUCTS.length} products.`);

  logger.info("СИНОНИМ · Seeding inventory levels...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 50,
        inventory_item_id: item.id,
      })),
    },
  });
  logger.info("СИНОНИМ · Finished seeding inventory levels.");

  logger.info(
    `СИНОНИМ · Seed complete. Publishable key: ${publishableApiKey.token}`
  );
  logger.info(
    "СИНОНИМ · Скопируйте ключ в apps/storefront/.env.local → NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"
  );
}
