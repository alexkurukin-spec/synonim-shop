import { type ReactNode, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { Stack, useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useCart } from "@/lib/cart"
import { formatPrice } from "@/lib/format"
import {
  Address,
  ShippingOption,
  addShippingMethod,
  completeCart,
  confirmationUrl,
  initiatePayment,
  listPaymentProviders,
  listShippingOptions,
  setCartAddresses,
} from "@/lib/medusa"
import { colors, radius, spacing } from "@/lib/theme"

type Step = "address" | "delivery" | "payment" | "done"

const EMPTY: Address & { email: string } = {
  email: "",
  first_name: "",
  last_name: "",
  address_1: "",
  city: "",
  postal_code: "",
  country_code: "ru",
  phone: "",
}

export default function CheckoutScreen() {
  const { cart, refresh, clear } = useCart()
  const router = useRouter()

  const [step, setStep] = useState<Step>("address")
  const [form, setForm] = useState({ ...EMPTY })
  const [busy, setBusy] = useState(false)
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [optionId, setOptionId] = useState<string | null>(null)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [orderNo, setOrderNo] = useState<string | number | null>(null)

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const cartId = cart?.id

  const validAddress =
    form.email && form.first_name && form.last_name && form.address_1 &&
    form.city && form.postal_code

  // Шаг 1 → 2: сохранить адрес, загрузить варианты доставки.
  const submitAddress = async () => {
    if (!cartId || !validAddress) {
      Alert.alert("Заполните поля", "Email, имя, фамилия, адрес, город, индекс.")
      return
    }
    setBusy(true)
    try {
      await setCartAddresses(cartId, form.email, {
        first_name: form.first_name,
        last_name: form.last_name,
        address_1: form.address_1,
        city: form.city,
        postal_code: form.postal_code,
        country_code: "ru",
        phone: form.phone,
      })
      const opts = await listShippingOptions(cartId)
      setOptions(opts)
      setOptionId(opts[0]?.id ?? null)
      setStep("delivery")
    } catch (e) {
      Alert.alert("Ошибка", (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  // Шаг 2 → 3: выбрать доставку, подобрать провайдера оплаты.
  const submitDelivery = async () => {
    if (!cartId || !optionId) return
    setBusy(true)
    try {
      await addShippingMethod(cartId, optionId)
      const providers = await listPaymentProviders()
      const preferred =
        providers.find((p) => p.id.startsWith("pp_yookassa")) ||
        providers.find((p) => p.id.startsWith("pp_system")) ||
        providers[0]
      setProviderId(preferred?.id ?? null)
      setStep("payment")
    } catch (e) {
      Alert.alert("Ошибка", (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  // Шаг 3: оплата + оформление.
  const placeOrder = async () => {
    if (!cartId || !providerId) return
    setBusy(true)
    try {
      const session = await initiatePayment(cartId, providerId)
      const url = confirmationUrl(session)
      if (url) {
        // ЮKassa: оплата во встроенном браузере, затем завершаем заказ.
        await WebBrowser.openBrowserAsync(url)
      }
      const result = await completeCart(cartId)
      if (result.type === "order") {
        setOrderNo(result.order.display_id ?? result.order.id)
        setStep("done")
        await clear()
      } else {
        Alert.alert(
          "Оплата не подтверждена",
          "Если вы оплатили — подождите немного и попробуйте снова."
        )
      }
    } catch (e) {
      Alert.alert("Ошибка", (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!cart) refresh()
  }, [cart, refresh])

  if (step === "done") {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Заказ оформлен", headerBackVisible: false }} />
        <Text style={styles.doneTitle}>Спасибо!</Text>
        <Text style={styles.doneText}>
          Заказ №{orderNo} оформлен. Мы свяжемся с вами для подтверждения.
        </Text>
        <Pressable style={styles.primary} onPress={() => router.replace("/")}>
          <Text style={styles.primaryText}>На главную</Text>
        </Pressable>
      </View>
    )
  }

  if (!cart || (cart.items || []).length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Корзина пуста.</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Оформление" }} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Шаг 1: адрес */}
        <Section title="1. Контакты и адрес" active={step === "address"}>
          {step === "address" ? (
            <View style={{ gap: spacing.sm }}>
              <Field label="Email" value={form.email} onChange={(v) => set("email", v)} keyboardType="email-address" />
              <Field label="Имя" value={form.first_name} onChange={(v) => set("first_name", v)} />
              <Field label="Фамилия" value={form.last_name} onChange={(v) => set("last_name", v)} />
              <Field label="Телефон" value={form.phone} onChange={(v) => set("phone", v)} keyboardType="phone-pad" />
              <Field label="Адрес" value={form.address_1} onChange={(v) => set("address_1", v)} />
              <Field label="Город" value={form.city} onChange={(v) => set("city", v)} />
              <Field label="Индекс" value={form.postal_code} onChange={(v) => set("postal_code", v)} keyboardType="number-pad" />
              <Primary busy={busy} onPress={submitAddress} label="Перейти к доставке" />
            </View>
          ) : (
            <Text style={styles.summary}>
              {form.first_name} {form.last_name}, {form.address_1}, {form.city},{" "}
              {form.postal_code}
            </Text>
          )}
        </Section>

        {/* Шаг 2: доставка */}
        <Section title="2. Доставка" active={step === "delivery"}>
          {step === "delivery" && (
            <View style={{ gap: spacing.sm }}>
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  style={[styles.option, optionId === o.id && styles.optionActive]}
                  onPress={() => setOptionId(o.id)}
                >
                  <Text style={styles.optionName}>{o.name}</Text>
                  {o.amount != null && (
                    <Text style={styles.optionPrice}>{formatPrice(o.amount)}</Text>
                  )}
                </Pressable>
              ))}
              {options.length === 0 && (
                <Text style={styles.muted}>Способы доставки недоступны.</Text>
              )}
              <Primary busy={busy} onPress={submitDelivery} label="Перейти к оплате" disabled={!optionId} />
            </View>
          )}
        </Section>

        {/* Шаг 3: оплата */}
        <Section title="3. Оплата" active={step === "payment"}>
          {step === "payment" && (
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.summary}>
                Способ оплаты:{" "}
                {providerId?.startsWith("pp_yookassa")
                  ? "Банковская карта · ЮKassa"
                  : "Оплата при получении / тест"}
              </Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Итого</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(cart.total ?? cart.subtotal)}
                </Text>
              </View>
              <Primary busy={busy} onPress={placeOrder} label="Оформить заказ" />
            </View>
          )}
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Section({
  title,
  active,
  children,
}: {
  title: string
  active: boolean
  children: ReactNode
}) {
  return (
    <View style={[styles.section, !active && styles.sectionDim]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad"
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || "default"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        style={styles.input}
        placeholderTextColor={colors.inkSubtle}
      />
    </View>
  )
}

function Primary({
  busy,
  onPress,
  label,
  disabled,
}: {
  busy: boolean
  onPress: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      style={[styles.primary, (busy || disabled) && styles.primaryDisabled]}
    >
      {busy ? (
        <ActivityIndicator color={colors.onDark} />
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  muted: { color: colors.inkSubtle },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionDim: { opacity: 0.6 },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  summary: { color: colors.inkSubtle, fontSize: 14 },
  fieldLabel: { color: colors.inkSubtle, fontSize: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  optionActive: { borderColor: colors.brandDark, backgroundColor: colors.sand },
  optionName: { color: colors.ink },
  optionPrice: { color: colors.inkSubtle },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  totalLabel: { color: colors.inkSubtle, fontSize: 16 },
  totalValue: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  primary: {
    backgroundColor: colors.brandDark,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: colors.onDark, fontSize: 16, fontWeight: "600" },
  doneTitle: { color: colors.brandDark, fontSize: 28, fontWeight: "700", marginBottom: spacing.sm },
  doneText: { color: colors.ink, textAlign: "center", marginBottom: spacing.lg },
})
