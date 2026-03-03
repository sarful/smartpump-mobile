import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "sp_device_id";

function generateId() {
  return `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;
  const id = generateId();
  await AsyncStorage.setItem(KEY, id);
  return id;
}
