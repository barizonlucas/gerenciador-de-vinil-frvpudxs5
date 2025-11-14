import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import typographyPlugin from '@tailwindcss/typography'

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        areia: 'hsl(var(--color-areia))',
        areiaEscuro: 'hsl(var(--color-areia-escuro))',
        brancoQuente: 'hsl(var(--color-branco-quente))',
        azulPetroleo: 'hsl(var(--color-azul-petroleo))',
        azulPetroleoEscuro: 'hsl(var(--color-azul-petroleo-escuro))',
        azulPetroleoMedio: 'hsl(var(--color-azul-petroleo-medio))',
        cinzaAmarelado: 'hsl(var(--color-cinza-amarelado))',
        cinzaAreia: 'hsl(var(--color-cinza-areia))',
        terracota: 'hsl(var(--color-terracota))',
        terracotaHover: 'hsl(var(--color-terracota-hover))',
        terracotaEscuro: 'hsl(var(--color-terracota-escuro))',
        verdeOliva: 'hsl(var(--color-verde-oliva))',
        verdeOlivaClaro: 'hsl(var(--color-verde-oliva-claro))',
        verdeOlivaHover: 'hsl(var(--color-verde-oliva-hover))',
        verdeOlivaMedio: 'hsl(var(--color-verde-oliva-medio))',
        amareloQueimado: 'hsl(var(--color-amarelo-queimado))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        brand: 'var(--shadow-brand)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [animatePlugin, typographyPlugin],
} satisfies Config
