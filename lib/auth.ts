import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signJWT(payload: { userId: string; pubkey: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyJWT(token: string): Promise<{ userId: string; pubkey: string }> {
  const { payload } = await jwtVerify(token, SECRET)
  return payload as { userId: string; pubkey: string }
}

export async function getAuthUser(): Promise<{ userId: string; pubkey: string } | null> {
  const token = (await cookies()).get('monipool_token')?.value
  if (!token) return null
  try {
    return await verifyJWT(token)
  } catch {
    return null
  }
}
