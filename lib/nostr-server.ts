import { finalizeEvent, getPublicKey } from 'nostr-tools'

const RELAYS = [
  process.env.NOSTR_RELAY_PRIMARY ?? 'wss://relay.damus.io',
  process.env.NOSTR_RELAY_FALLBACK ?? 'wss://nos.lol',
]

const RELAY_TIMEOUT_MS = 6000
const MAX_RETRIES = 2

async function publishToRelay(
  event: ReturnType<typeof finalizeEvent>,
  relayUrl: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(relayUrl)
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error(`Relay ${relayUrl} timed out`))
    }, RELAY_TIMEOUT_MS)

    ws.onopen = () => {
      ws.send(JSON.stringify(['EVENT', event]))
    }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string) as unknown[]
        // OK confirmation: ['OK', event_id, true/false, message]
        if (msg[0] === 'OK' && msg[1] === event.id) {
          clearTimeout(timeout)
          ws.close()
          if (msg[2] === true) {
            resolve()
          } else {
            reject(new Error(`Relay rejected event: ${String(msg[3])}`))
          }
        }
      } catch {
        // non-JSON message from relay — ignore
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      reject(new Error(`WebSocket error on ${relayUrl}`))
    }

    ws.onclose = () => {
      clearTimeout(timeout)
    }
  })
}

/**
 * Attempts to publish to each relay in order, retrying on failure.
 * Returns when the first relay confirms the event.
 * Throws only if ALL relays fail after retries.
 */
async function publishWithRetry(event: ReturnType<typeof finalizeEvent>): Promise<void> {
  const errors: string[] = []

  for (const relayUrl of RELAYS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await publishToRelay(event, relayUrl)
        return // success — done
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${relayUrl} (attempt ${attempt}): ${msg}`)
        if (attempt < MAX_RETRIES) {
          // brief back-off before retry
          await new Promise((r) => setTimeout(r, 500 * attempt))
        }
      }
    }
  }

  throw new Error(`All Nostr relays failed:\n${errors.join('\n')}`)
}

function getServicePrivkey(): Uint8Array {
  const hex = process.env.NOSTR_SERVICE_PRIVKEY
  if (!hex || hex.startsWith('your_')) {
    throw new Error('NOSTR_SERVICE_PRIVKEY is not configured')
  }
  return Buffer.from(hex, 'hex') as unknown as Uint8Array
}

/**
 * Posts a pool activity message to the pool's Nostr community feed.
 * Failures are logged but do NOT throw — pool actions must not fail
 * because of a Nostr relay issue.
 */
export async function postPoolActivity(nostrGroupId: string, message: string): Promise<void> {
  try {
    const privkey = getServicePrivkey()
    const pubkey = getPublicKey(privkey)
    const event = finalizeEvent(
      {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['a', `34550:${pubkey}:${nostrGroupId}`],
          ['t', 'monipool'],
        ],
        content: message,
      },
      privkey
    )
    await publishWithRetry(event)
    console.log(`[MoniPool] Nostr activity posted: "${message.slice(0, 60)}"`)
  } catch (err) {
    // Non-fatal — pool action already succeeded, Nostr is best-effort
    console.error('[MoniPool Error] Nostr postPoolActivity failed:', err instanceof Error ? err.message : err)
  }
}

/**
 * Creates a Nostr community (kind 34550) for a new pool.
 * Returns the event ID which becomes the pool's nostrGroupId.
 * Throws on failure — pool creation should be aware if community setup failed.
 */
export async function createPoolCommunity(poolId: string, poolName: string): Promise<string> {
  const privkey = getServicePrivkey()
  const event = finalizeEvent(
    {
      kind: 34550,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', poolId],
        ['name', poolName],
        ['relay', RELAYS[0]],
      ],
      content: '',
    },
    privkey
  )
  await publishWithRetry(event)
  return event.id
}
