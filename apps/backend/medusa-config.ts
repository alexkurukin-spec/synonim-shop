import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      // Слой фискализации 54-ФЗ (Фаза 5). Облачная касса подключается позже;
      // без ключей продажа остаётся в pending_fiscalization (без имитации).
      resolve: "./src/modules/fiscalization",
      options: {
        provider: process.env.FISCAL_PROVIDER,
        apiKey: process.env.FISCAL_API_KEY,
        taxSystem: process.env.FISCAL_TAX_SYSTEM,
      },
    },
    {
      // Payment-модуль с провайдером РФ-эквайринга ЮKassa (Фаза 4).
      // Системный провайдер (pp_system_default) Medusa добавляет автоматически.
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/yookassa",
            id: "yookassa",
            options: {
              shopId: process.env.YOOKASSA_SHOP_ID,
              secretKey: process.env.YOOKASSA_SECRET_KEY,
              capture: process.env.YOOKASSA_CAPTURE === "true",
              returnUrl: process.env.YOOKASSA_RETURN_URL,
            },
          },
        ],
      },
    },
  ],
})
