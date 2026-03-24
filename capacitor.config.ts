import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.animalifacili.app',
  appName: 'Animali Facili',
  webDir: 'out',
  server: {
    url: 'http://10.0.2.2:3000',
    cleartext: true,
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
  },
}

export default config