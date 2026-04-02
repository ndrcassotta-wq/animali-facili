import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.animalifacili.app',
  appName: 'Animali Facili',
  webDir: 'out',
  server: {
    url: 'https://app.animalifacili.it',
    cleartext: false,
  },
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff',
      overlay: false,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#fdf8ec',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_animali_facili',
      iconColor: '#8C6A43',
    },
  },
}

export default config