import { finalizeEvent, getPublicKey } from 'nostr-tools'

// HACKATHON: fire-and-forget Nostr publishing - add proper error handling post-demo
async function publishToRelay(event: ReturnType<typeof finalizeEvent>): Promise<void> {
  const relays = [
    process.env.NOSTR_RELAY_PRIMARY ?? 'wss://relay.damus.io',
    process.env.NOSTR_RELAY_FALLBACK ?? 'wss://nos.lol',
  ]

  for (const url of relays) {
    try {
      const ws = new WebSocket(url)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close()
          reject(new Error('Relay timeout'))
        }, 5000)

        ws.onopen = () => {
          ws.send(JSON.stringify(['EVENT', event]))
          clearTimeout(timeout)
          setTimeout(() => {
            ws.close()
            resolve()
          }, 1000)
        }
        ws.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('WebSocket error'))
        }
      })
      return
    } catch {
      // try next relay
    }
  }
}

function getServicePrivkey(): Uint8Array {
  const hex = process.env.NOSTR_SERVICE_PRIVKEY!
  return Buffer.from(hex, 'hex') as unknown as Uint8Array
}

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
    await publishToRelay(event)
  } catch (err) {
    console.error('[MoniPool Error] Failed to post Nostr activity:', err)
  }
}

export async function createPoolCommunity(poolId: string, poolName: string): Promise<string> {
  const privkey = getServicePrivkey()
  const event = finalizeEvent(
    {
      kind: 34550,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', poolId],
        ['name', poolName],
        ['relay', process.env.NOSTR_RELAY_PRIMARY ?? 'wss://relay.damus.io'],
      ],
      content: '',
    },
    privkey
  )
  await publishToRelay(event)
  return event.id
}
