import { Tabs, router } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@shared/theme";
import { TradeTabButton } from "@shared/components/TradeTabButton";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // On Xiaomi / HyperOS phones with gesture navigation, `insets.bottom`
  // often reports 0 even though a system gesture indicator is still
  // drawn at the bottom of the screen — that indicator visually covers
  // the tab labels. Enforcing a minimum bottom gap (10 dp Android,
  // 8 dp iOS) keeps the labels above the gesture bar on every device.
  // Lowered from 16/12 → 10/8 along with the bar height reduction below.
  const minBottom = Platform.OS === "android" ? 10 : 8;
  // Respect the FULL OS-reported bottom inset — do NOT cap it. A previous
  // 16 dp cap saved a little empty space on some gesture-nav phones, but on
  // devices with 3-BUTTON navigation the system bar is a real ~40–48 dp tall
  // strip; clipping the pad to 16 dp let the ◁ ○ ▷ buttons render ON TOP of
  // the tab labels (the overlap the user reported). The inset already
  // reflects the actual nav-bar height per device, so trusting it clears the
  // buttons on both gesture and 3-button phones. (Floor keeps labels above a
  // thin gesture pill on phones that under-report the inset as 0.)
  //
  // + a fixed NAV_CLEARANCE so the labels don't sit flush against the
  // ◁ ○ ☐ buttons: padding == inset alone put the label baseline exactly at
  // the top edge of the nav bar (user: "thoda upar rakhna"). A few extra dp
  // of breathing room lifts the whole row clear of the system bar.
  const NAV_CLEARANCE = 8;
  const bottomInset = Math.max(insets.bottom, minBottom) + NAV_CLEARANCE;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // Trimmed bar from 60 → 48 dp + tighter top padding so the bar
          // doesn't dominate the screen on small phones. Total bar height
          // becomes 48 + insets.bottom (typically ~12-20 dp on modern
          // Android with gesture nav), matching Zerodha / Groww proportions.
          height: 48 + bottomInset,
          paddingTop: 4,
          paddingBottom: bottomInset,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          tabBarLabel: "Market",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          tabBarLabel: () => null,
          tabBarButton: () => (
            <TradeTabButton onPress={() => router.push("/(tabs)/trade")} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "reader" : "reader-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          tabBarLabel: "Positions",
          // Pie-chart icon reads as "portfolio allocation" / "open positions
          // by instrument" at a glance — much more on-theme for an Indian
          // trading app than a generic briefcase.
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "pie-chart" : "pie-chart-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />
    </Tabs>
  );
}
