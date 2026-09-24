// index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndInit = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");

        // Jeda waktu untuk splash screen logo (misal 3 detik atau sesuaikan)
        const timer = setTimeout(() => {
          if (!isMounted) return;

          if (token) {
            // Jika sudah login, arahkan langsung ke dashboard
            setRedirectPath("/(tabs)/dashboard");
          } else {
            // Jika belum login, arahkan ke login
            setRedirectPath("/login");
          }
          setIsReady(true);
        }, 3000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Gagal memeriksa sesi login:", error);
        if (isMounted) {
          setRedirectPath("/login");
          setIsReady(true);
        }
      }
    };

    checkAuthAndInit();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isReady && redirectPath) {
    return <Redirect href={redirectPath as any} />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-theme-black">
      <Image source={require("../../assets/images/Logo.svg")} style={styles.logo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 500,
    height: 500,
  },
});
