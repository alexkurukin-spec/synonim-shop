import { Tabs } from "expo-router"
import { Text, View } from "react-native"
import { useCart } from "@/lib/cart"
import { colors } from "@/lib/theme"

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{symbol}</Text>
}

export default function TabsLayout() {
  const { count } = useCart()

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.brandDark,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: colors.brandDark,
        tabBarInactiveTintColor: colors.inkSubtle,
        sceneContainerStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color }) => <TabIcon symbol="◆" color={color} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Каталог",
          tabBarIcon: ({ color }) => <TabIcon symbol="≣" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Корзина",
          tabBarIcon: ({ color }) => (
            <View>
              <TabIcon symbol="🛍" color={color} />
              {count > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: -10,
                    top: -4,
                    backgroundColor: colors.accentDeep,
                    borderRadius: 9,
                    minWidth: 18,
                    height: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: colors.onDark, fontSize: 11 }}>
                    {count}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Кабинет",
          tabBarIcon: ({ color }) => <TabIcon symbol="☺" color={color} />,
        }}
      />
    </Tabs>
  )
}
