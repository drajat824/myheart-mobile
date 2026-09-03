import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="records_disorder" options={{ headerShown: false }} />
      <Stack.Screen name="records_hr" options={{ headerShown: false }} />
      <Stack.Screen name="records_periodic" options={{ headerShown: false }} />
    </Stack>
  );
}
