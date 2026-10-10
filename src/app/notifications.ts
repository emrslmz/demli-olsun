/**
 * "Günün siparişi geldi ☕" yerel bildirimi (opsiyonel). İzin yalnızca kullanıcı açarsa istenir.
 * Günlük tekrar eden, esnek zamanlı bildirim (tam zamanlı alarm izni gerekmez).
 */

import { Capacitor } from '@capacitor/core'
import { useSettingsStore } from '@/stores/settings'
import { saveNow } from '@/stores/persist'
import { tr } from '@/i18n/tr'

const NOTIF_ID = 4242

export async function toggleNotifications(on: boolean): Promise<boolean> {
  const settings = useSettingsStore()
  if (!Capacitor.isNativePlatform()) {
    settings.update({ notifications: on })
    void saveNow()
    return true
  }
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  if (!on) {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] }).catch(() => undefined)
    settings.update({ notifications: false })
    void saveNow()
    return true
  }
  let perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
  if (perm.display !== 'granted') {
    settings.update({ notifications: false })
    void saveNow()
    return false
  }
  await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] }).catch(() => undefined)
  await LocalNotifications.schedule({
    notifications: [
      {
        id: NOTIF_ID,
        title: tr.notification.title,
        body: tr.notification.body,
        schedule: { on: { hour: settings.data.notifyHour, minute: 0 }, allowWhileIdle: false },
      },
    ],
  })
  settings.update({ notifications: true })
  void saveNow()
  return true
}
