import { useState, useEffect, useCallback } from 'react'
import { DiscogsSearchResult } from '@/types/discogs'
import { searchDiscogs } from '@/services/discogs'
import { useDebounce } from '@/hooks/use-debounce'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from '@/components/ui/command'
import { Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface DiscogsSearchProps {
  onSelect: (result: DiscogsSearchResult) => void
}

export const DiscogsSearch = ({ onSelect }: DiscogsSearchProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DiscogsSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 3) {
        setResults([])
        setIsOpen(false)
        return
      }

      setLoading(true)
      setError(null)
      setIsOpen(true)

      try {
        const data = await searchDiscogs(debouncedQuery)
        setResults(data)
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro na busca.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  const handleSelect = useCallback(
    (result: DiscogsSearchResult) => {
      onSelect(result)
      setQuery('')
      setResults([])
      setIsOpen(false)
    },
    [onSelect],
  )

  return (
    <Command shouldFilter={false} className="relative">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Nome do álbum ou artista..."
        onFocus={() => query.length >= 3 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {isOpen && (
        <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <CommandList>
            {loading && (
              <div className="p-4 flex justify-center items-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {error && <CommandEmpty>{error}</CommandEmpty>}
            {!loading &&
              !error &&
              results.length === 0 &&
              debouncedQuery.length >= 3 && (
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              )}
            {!loading && !error && results.length > 0 && (
              <CommandGroup>
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar className="h-10 w-10 rounded-sm">
                      <AvatarImage
                        src={result.coverArtUrl}
                        alt={result.albumTitle}
                      />
                      <AvatarFallback className="rounded-sm">?</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium truncate">
                        {result.albumTitle}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {result.artist} {result.year && `(${result.year})`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </div>
      )}
    </Command>
  )
}
