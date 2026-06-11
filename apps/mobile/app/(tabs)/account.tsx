import { useState } from "react"
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
import { useRouter } from "expo-router"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/lib/favorites"
import { colors, radius, spacing } from "@/lib/theme"

export default function AccountScreen() {
  const { customer, loading, login, register, logout, save } = useAuth()
  const { count: favCount } = useFavorites()
  const router = useRouter()

  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  // ── Авторизован: профиль ───────────────────────────────────────────────────
  if (customer) {
    return (
      <ProfileView
        customer={customer}
        favCount={favCount}
        onSave={save}
        onLogout={logout}
        onOrders={() => router.push("/orders")}
        onFavorites={() => router.push("/favorites")}
      />
    )
  }

  // ── Не авторизован: вход / регистрация ─────────────────────────────────────
  const submit = async () => {
    if (!email || !password) {
      Alert.alert("Заполните поля", "Email и пароль обязательны.")
      return
    }
    setBusy(true)
    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await register({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        })
      }
    } catch (e) {
      Alert.alert("Ошибка", (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>
          {mode === "login" ? "Вход" : "Регистрация"}
        </Text>

        {mode === "register" && (
          <>
            <Field label="Имя" value={firstName} onChange={setFirstName} />
            <Field label="Фамилия" value={lastName} onChange={setLastName} />
          </>
        )}
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          keyboardType="email-address"
        />
        <Field label="Пароль" value={password} onChange={setPassword} secure />

        <Pressable
          style={[styles.primary, busy && styles.primaryDisabled]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.onDark} />
          ) : (
            <Text style={styles.primaryText}>
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === "login" ? "register" : "login")}
        >
          <Text style={styles.switch}>
            {mode === "login"
              ? "Нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function ProfileView({
  customer,
  favCount,
  onSave,
  onLogout,
  onOrders,
  onFavorites,
}: {
  customer: { email: string; first_name?: string | null; last_name?: string | null; phone?: string | null }
  favCount: number
  onSave: (d: { first_name?: string; last_name?: string; phone?: string }) => Promise<void>
  onLogout: () => Promise<void>
  onOrders: () => void
  onFavorites: () => void
}) {
  const [firstName, setFirstName] = useState(customer.first_name || "")
  const [lastName, setLastName] = useState(customer.last_name || "")
  const [phone, setPhone] = useState(customer.phone || "")
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      await onSave({ first_name: firstName, last_name: lastName, phone })
      Alert.alert("Сохранено")
    } catch (e) {
      Alert.alert("Ошибка", (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>
        Здравствуйте{firstName ? `, ${firstName}` : ""}
      </Text>
      <Text style={styles.email}>{customer.email}</Text>

      <View style={styles.links}>
        <Pressable style={styles.linkRow} onPress={onOrders}>
          <Text style={styles.linkText}>Мои заказы</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={onFavorites}>
          <Text style={styles.linkText}>Избранное{favCount ? ` (${favCount})` : ""}</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Профиль</Text>
      <Field label="Имя" value={firstName} onChange={setFirstName} />
      <Field label="Фамилия" value={lastName} onChange={setLastName} />
      <Field label="Телефон" value={phone} onChange={setPhone} keyboardType="phone-pad" />
      <Pressable
        style={[styles.primary, busy && styles.primaryDisabled]}
        onPress={save}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.onDark} />
        ) : (
          <Text style={styles.primaryText}>Сохранить</Text>
        )}
      </Pressable>

      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </Pressable>
    </ScrollView>
  )
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  secure,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  keyboardType?: "default" | "email-address" | "phone-pad"
  secure?: boolean
}) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || "default"}
        secureTextEntry={secure}
        autoCapitalize={keyboardType === "email-address" || secure ? "none" : "sentences"}
        style={styles.input}
        placeholderTextColor={colors.inkSubtle}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  heading: { color: colors.brandDark, fontSize: 24, fontWeight: "700", marginBottom: spacing.md },
  email: { color: colors.inkSubtle, marginBottom: spacing.lg },
  section: { color: colors.brandDark, fontSize: 16, fontWeight: "700", marginTop: spacing.lg, marginBottom: spacing.sm },
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
  primary: {
    backgroundColor: colors.brandDark,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: colors.onDark, fontSize: 16, fontWeight: "600" },
  switch: { color: colors.brandDark, textAlign: "center", marginTop: spacing.md },
  links: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linkText: { color: colors.ink, fontSize: 15 },
  linkChevron: { color: colors.inkSubtle, fontSize: 22 },
  logout: { marginTop: spacing.lg, alignItems: "center", padding: spacing.md },
  logoutText: { color: colors.accentDeep, fontSize: 15 },
})
