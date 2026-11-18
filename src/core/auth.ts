// PBKDF2-SHA256 через WebCrypto — работает и в браузере, и в Node 20+.
const enc = new TextEncoder()
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const ITER = 100_000

async function derive(password: string, salt: Uint8Array, iter: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: iter }, key, 256)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await derive(password, salt, ITER))}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, iter, salt, hash] = stored.split('$')
  if (alg !== 'pbkdf2') return false
  const got = b64(await derive(password, unb64(salt), Number(iter)))
  // сравнение без раннего выхода
  let diff = got.length ^ hash.length
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ (hash.charCodeAt(i) || 0)
  return diff === 0
}

/** Подписанный токен сессии (HMAC-SHA256): payload.signature */
export async function signToken(secret: string, payload: Record<string, unknown>, ttlSec = 8 * 3600): Promise<string> {
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec }))
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return `${body}.${b64(await crypto.subtle.sign('HMAC', key, enc.encode(body)))}`
}

export async function verifyToken(secret: string, token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const ok = await crypto.subtle.verify('HMAC', key, unb64(sig) as BufferSource, enc.encode(body))
  if (!ok) return null
  const data = JSON.parse(atob(body))
  return data.exp > Date.now() / 1000 ? data : null
}

/** HMAC-подпись webhook платёжного шлюза (hex) */
export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)))].map((b) => b.toString(16).padStart(2, '0')).join('')
}
