import { useState, useEffect, useRef, useCallback } from 'react'
import { DiscogsSearchResult } from '@/types/discogs'
import { useDiscogsSearch } from '@/hooks/use-discogs-search'

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
  const { query, setQuery, results, loading, error: searchError } =
    useDiscogsSearch()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
    const hasQuery = trimmed.length >= 3
    const hasResults = results.length > 0
    const message =
      searchError ||
      (!loading && hasQuery && !hasResults ? 'Nenhum resultado encontrado.' : null)

    const shouldOpen = hasQuery && (loading || hasResults || !!message)
    setIsOpen(shouldOpen)
  }, [query, loading, results, searchError])

  const handleSelect = useCallback(
    (result: DiscogsSearchResult) => {
      onSelect(result)
      setQuery('')
      setIsOpen(false)
    },
    [onSelect, setQuery],
  )

  return (
    <div ref={containerRef} className="relative">
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Nome do álbum ou artista..."
          onFocus={() => query.trim().length >= 3 && results.length > 0 && setIsOpen(true)}
          onBlur={(event) => {
            // Delay close to allow click in list
            requestAnimationFrame(() => {
              if (
                containerRef.current &&
                event.relatedTarget &&
                containerRef.current.contains(event.relatedTarget as Node)
              ) {
                return
              }
              setIsOpen(false)
            })
          }}
        />
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-80 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg focus:outline-none"
            role="listbox"
            onMouseDown={(event) => {
              // Prevent closing when clicking inside
              event.preventDefault()
            }}
          >
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              {searchError && !loading && (
                <CommandEmpty className="p-4 text-sm text-muted-foreground">
                  {searchError}
                </CommandEmpty>
              )}
              {!loading && !searchError && results.length > 0 && (
                <CommandGroup>
                  {results.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <Avatar className="h-10 w-10 rounded-sm">
                        <AvatarImage
                          src={result.coverArtUrl}
                          alt={result.albumTitle}
                        />
                        <AvatarFallback className="rounded-sm">
                          ?
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="truncate font-medium">
                          {result.albumTitle}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          {result.artist} {result.year && `• ${result.year}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!loading &&
                !searchError &&
                results.length === 0 &&
                query.trim().length >= 3 && (
                <CommandEmpty className="p-4 text-sm text-muted-foreground">
                  Nenhum resultado encontrado.
                </CommandEmpty>
              )}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  )
}
