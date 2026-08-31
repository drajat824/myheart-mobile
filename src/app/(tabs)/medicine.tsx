import { StyleSheet, Text, View } from "react-native";

export default function Medicine() {
  return (
    <View style={styles.container}>
      <Text>Ini adalah Medicine SCREEN</Text>
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
