import { createMMKV } from 'react-native-mmkv'
import 'react-native-nitro-modules'
import { configureNativePersistence, createMMKVAdapter } from './persistence'

configureNativePersistence((id) => createMMKVAdapter(createMMKV({ id })))
