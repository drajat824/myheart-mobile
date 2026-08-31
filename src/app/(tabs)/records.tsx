import { StyleSheet, Text, View } from "react-native";

export default function Record() {
  return (
    <View style={styles.container}>
      <Text>Ini adalah Record SCREEN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
