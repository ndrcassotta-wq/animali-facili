import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.animalifacili.app',
  appName: 'Animali Facili',
  webDir: 'out',
  server: {
    url: 'https://animali-facili.vercel.app',
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
  },
}

export default config