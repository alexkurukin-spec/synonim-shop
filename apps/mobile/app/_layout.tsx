import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { CartProvider } from "@/lib/cart"
import { colors } from "@/lib/theme"

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.brandDark,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[handle]" options={{ title: "Товар" }} />
          <Stack.Screen name="checkout" options={{ title: "Оформление" }} />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  )
}
