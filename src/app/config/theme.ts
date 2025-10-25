import Aura from '@primeuix/themes/aura';

export const primeTheme = {
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: 'primereact',
        order: 'theme, base, primereact'
      },
      darkModeSelector: ".dark",
      // Brand semantic colors used by severity="primary|secondary|warning"
      semantic: {
        primary: { color: '#2665D6' },
        secondary: { color: '#E6291B' },
        warning: { color: '#D2E823' }
      }
    }
  },
};