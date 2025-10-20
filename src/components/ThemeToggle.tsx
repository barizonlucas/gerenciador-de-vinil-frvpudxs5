import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-2 rounded-full border p-1">
      <Button
        variant={theme === 'light' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => setTheme('light')}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => setTheme('dark')}
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  )
}
