import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  Customer,
  getCurrentCustomer,
  loginCustomer,
  registerCustomer,
  setAuthToken,
  updateCustomer,
} from "./medusa"

const TOKEN_KEY = "synonim_auth_token"

type AuthContextValue = {
  customer: Customer | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (params: {
    email: string
    password: string
    first_name?: string
    last_name?: string
  }) => Promise<void>
  logout: () => Promise<void>
  save: (data: {
    first_name?: string
    last_name?: string
    phone?: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  // Восстановление сессии при старте.
  useEffect(() => {
    ;(async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY)
        if (token) {
          setAuthToken(token)
          const me = await getCurrentCustomer()
          if (me) setCustomer(me)
          else {
            // токен протух
            setAuthToken(null)
            await AsyncStorage.removeItem(TOKEN_KEY)
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const persist = useCallback(async (token: string) => {
    setAuthToken(token)
    await AsyncStorage.setItem(TOKEN_KEY, token)
    const me = await getCurrentCustomer()
    setCustomer(me)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const token = await loginCustomer(email, password)
      await persist(token)
    },
    [persist]
  )

  const register = useCallback(
    async (params: {
      email: string
      password: string
      first_name?: string
      last_name?: string
    }) => {
      const token = await registerCustomer(params)
      await persist(token)
    },
    [persist]
  )

  const logout = useCallback(async () => {
    setAuthToken(null)
    await AsyncStorage.removeItem(TOKEN_KEY)
    setCustomer(null)
  }, [])

  const save = useCallback(
    async (data: { first_name?: string; last_name?: string; phone?: string }) => {
      const updated = await updateCustomer(data)
      setCustomer(updated)
    },
    []
  )

  const value = useMemo(
    () => ({ customer, loading, login, register, logout, save }),
    [customer, loading, login, register, logout, save]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth должен использоваться внутри AuthProvider")
  return ctx
}
