import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { setStore, useStore } from 'reboil/react'

export default function App() {
  const count = useStore('count')
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Reboil + React Native 0.88</Text>
        <Text accessibilityLiveRegion="polite" style={styles.count}>
          Count: {count}
        </Text>
        <View style={styles.actions}>
          <Button title="Decrement" onPress={() => setStore('count', (value) => value - 1)} />
          <Button title="Increment" onPress={() => setStore('count', (value) => value + 1)} />
          <Button title="Reset" onPress={() => setStore('count', 0)} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eff6ff' },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 20 },
  title: { color: '#172554', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  count: { color: '#172554', fontSize: 20, textAlign: 'center' },
  actions: { gap: 12 },
})
