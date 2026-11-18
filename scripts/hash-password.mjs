// Генерация хэша пароля админа: node scripts/hash-password.mjs "<пароль>"
// Результат положить в ADMIN_PASSWORD_HASH (server) — пароль в репозитории и окружении не хранится.
const enc = new TextEncoder()
const salt = crypto.getRandomValues(new Uint8Array(16))
const key = await crypto.subtle.importKey('raw', enc.encode(process.argv[2] ?? ''), 'PBKDF2', false, ['deriveBits'])
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256)
const b = (x) => Buffer.from(x).toString('base64')
console.log(`pbkdf2$100000$${b(salt)}$${b(bits)}`)
