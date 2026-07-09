import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Welcome to Lumora</Text>
      <Text style={styles.title}>Your AI study companion.</Text>
      <Text style={styles.body}>
        Turn PDFs and notes into summaries, explanations, flashcards, quizzes,
        and focused learning sessions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#031412",
  },
  eyebrow: {
    color: "#5EEAD4",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    color: "#F3FFFB",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    marginBottom: 12,
  },
  body: {
    color: "#B8D4CD",
    fontSize: 16,
    lineHeight: 24,
  },
});
