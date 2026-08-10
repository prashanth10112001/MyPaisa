import "@/global.css";
import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="addTransaction"
          options={{
            animation: "slide_from_bottom",
            presentation: "transparentModal",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
