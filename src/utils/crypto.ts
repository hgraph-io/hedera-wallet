export class CryptoUtils {
  private static readonly SALT_LENGTH = 16
  private static readonly IV_LENGTH = 12
  private static readonly ITERATIONS = 100000

  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
  }

  static async encrypt(plaintext: string, password: string): Promise<string> {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
    const key = await this.deriveKey(password, salt)

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext),
    )

    const encryptedArray = new Uint8Array(encrypted)
    const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(encryptedArray, salt.length + iv.length)

    return btoa(String.fromCharCode(...combined))
  }

  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))
      const salt = combined.slice(0, this.SALT_LENGTH)
      const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH)
      const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH)

      const key = await this.deriveKey(password, salt)
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      throw new Error('Failed to decrypt data. Invalid password or corrupted data.')
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
  }
}
