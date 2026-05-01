type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'dark')

  function apply(t: Theme) {
    theme.value = t
    document.documentElement.dataset.theme = t
    localStorage.setItem(STORAGE_KEY, t)
  }

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    apply(saved ?? system)
  }

  return { theme, toggle, init }
}
