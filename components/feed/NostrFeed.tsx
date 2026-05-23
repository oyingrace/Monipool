'use client'

import { useEffect, useRef, useState } from 'react'
import { Radio } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { FeedItem } from '@/types'

interface NostrFeedProps {
  nostrGroupId: string
  poolName: string
}

export function NostrFeed({ nostrGroupId, poolName }: NostrFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let dead = false

    const connect = (): void => {
      if (dead) return
      const relayUrl = process.env.NEXT_PUBLIC_NOSTR_RELAY ?? 'wss://relay.damus.io'
      const ws = new WebSocket(relayUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        const filter = {
          kinds: [1],
          '#t': ['monipool'],
          '#a': [`34550:${process.env.NEXT_PUBLIC_NOSTR_SERVICE_PUBKEY}:${nostrGroupId}`],
          limit: 20,
        }
        ws.send(JSON.stringify(['REQ', `feed-${nostrGroupId}`, filter]))
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as unknown[]
          if (msg[0] === 'EVENT') {
            const event = msg[2] as { id: string; content: string; created_at: number }
            setItems((prev) => {
              if (prev.some((i) => i.id === event.id)) return prev
              return [
                { id: event.id, message: event.content, timestamp: event.created_at, type: 'general' as const },
                ...prev,
              ].slice(0, 50)
            })
          }
        } catch {
          // malformed relay message
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!dead) {
          reconnectRef.current = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      dead = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [nostrGroupId])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Pool Activity</CardTitle>
          <span className="relative flex size-2">
            {connected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
          </span>
          <span className="text-xs text-muted-foreground">{connected ? 'Live' : 'Reconnecting…'}</span>
        </div>
      </CardHeader>

      {items.length === 0 ? (
        <CardContent className="py-12 text-center">
          <Radio className="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {connected ? `Listening for ${poolName} activity…` : 'Connecting to feed…'}
          </p>
        </CardContent>
      ) : (
        <ul className="divide-y divide-border/50 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3.5 text-sm">
              <p className="text-foreground leading-relaxed">{item.message}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono tabular-nums">
                {new Date(item.timestamp * 1000).toLocaleTimeString('en-NG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
