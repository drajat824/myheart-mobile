import { Image } from "expo-image";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function Index() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  if (isReady) {
    return <Redirect href="/login" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-theme-black">
      <Image source={require("../../assets/images/Logo.svg")} style={styles.logo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 350,
    height: 350,
  },
});
