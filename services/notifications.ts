import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// SDK 53 requiere shouldShowBanner y shouldShowList
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Pedir permisos — sin push token (no compatible con Expo Go SDK 53)
export async function registerForPushNotifications(): Promise<boolean> {
  if (!Device.isDevice) return true; // emulador, continuar igual

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('concerts', {
      name: 'Conciertos',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  return true;
}

// Programar notificación local
export async function scheduleConcertNotification(
  concertName: string,
  concertDate: string,
  daysBefore: number
): Promise<string | null> {
  const concertTime = new Date(concertDate).getTime();
  const notifyTime = concertTime - daysBefore * 24 * 60 * 60 * 1000;

  if (notifyTime <= Date.now()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎵 ¡${concertName} en ${daysBefore === 1 ? '1 día' : `${daysBefore} días`}!`,
      body: daysBefore === 1
        ? '¡Mañana es el concierto! ¿Tienes todo listo?'
        : `Faltan ${daysBefore} días. ¡Prepárate!`,
      sound: 'default',
      data: { concertName },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(notifyTime),
      channelId: 'concerts',
    },
  });

  return id;
}

export async function cancelConcertNotifications(ids: string[]) {
  await Promise.all(ids.map(id =>
    Notifications.cancelScheduledNotificationAsync(id)
  ));
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
