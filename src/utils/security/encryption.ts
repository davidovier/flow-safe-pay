/**
 * Client-side encryption utilities for FlowPay
 * Handles encryption of sensitive data before transmission
 */

/**
 * Generate a cryptographically secure key
 */
export async function generateKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt
 */
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random initialization vector
 */
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(
  data: string,
  key: CryptoKey
): Promise<{
  encrypted: ArrayBuffer;
  iv: Uint8Array;
}> {
  const encoder = new TextEncoder();
  const iv = generateIV();
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encoder.encode(data)
  );

  return { encrypted, iv };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash sensitive data using SHA-256
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Secure storage interface for encrypted data
 */
export interface EncryptedStorage {
  set(key: string, value: string, password: string): Promise<void>;
  get(key: string, password: string): Promise<string | null>;
  remove(key: string): void;
  clear(): void;
}

/**
 * Implementation of encrypted localStorage
 */
export class EncryptedLocalStorage implements EncryptedStorage {
  private prefix = 'encrypted_';

  async set(key: string, value: string, password: string): Promise<void> {
    try {
      const salt = generateSalt();
      const derivedKey = await deriveKey(password, salt);
      const { encrypted, iv } = await encrypt(value, derivedKey);

      const storageValue = {
        salt: arrayBufferToBase64(salt.buffer),
        iv: arrayBufferToBase64(iv.buffer),
        data: arrayBufferToBase64(encrypted)
      };

      localStorage.setItem(
        this.prefix + key,
        JSON.stringify(storageValue)
      );
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt and store data');
    }
  }

  async get(key: string, password: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const { salt, iv, data } = JSON.parse(stored);
      const saltArray = new Uint8Array(base64ToArrayBuffer(salt));
      const ivArray = new Uint8Array(base64ToArrayBuffer(iv));
      const encryptedData = base64ToArrayBuffer(data);

      const derivedKey = await deriveKey(password, saltArray);
      return await decrypt(encryptedData, derivedKey, ivArray);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Implementation of encrypted sessionStorage
 */
export class EncryptedSessionStorage implements EncryptedStorage {
  private prefix = 'encrypted_';

  async set(key: string, value: string, password: string): Promise<void> {
    try {
      const salt = generateSalt();
      const derivedKey = await deriveKey(password, salt);
      const { encrypted, iv } = await encrypt(value, derivedKey);

      const storageValue = {
        salt: arrayBufferToBase64(salt.buffer),
        iv: arrayBufferToBase64(iv.buffer),
        data: arrayBufferToBase64(encrypted)
      };

      sessionStorage.setItem(
        this.prefix + key,
        JSON.stringify(storageValue)
      );
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt and store data');
    }
  }

  async get(key: string, password: string): Promise<string | null> {
    try {
      const stored = sessionStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const { salt, iv, data } = JSON.parse(stored);
      const saltArray = new Uint8Array(base64ToArrayBuffer(salt));
      const ivArray = new Uint8Array(base64ToArrayBuffer(iv));
      const encryptedData = base64ToArrayBuffer(data);

      const derivedKey = await deriveKey(password, saltArray);
      return await decrypt(encryptedData, derivedKey, ivArray);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  remove(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

/**
 * Utility class for handling sensitive form data
 */
export class SensitiveDataHandler {
  private encryptedStorage: EncryptedStorage;
  private userKey: string;

  constructor(storage: 'local' | 'session' = 'session', userKey: string) {
    this.encryptedStorage = storage === 'local' 
      ? new EncryptedLocalStorage() 
      : new EncryptedSessionStorage();
    this.userKey = userKey;
  }

  /**
   * Store sensitive data temporarily
   */
  async storeSensitiveData(key: string, data: any): Promise<void> {
    const serializedData = JSON.stringify(data);
    await this.encryptedStorage.set(key, serializedData, this.userKey);
  }

  /**
   * Retrieve sensitive data
   */
  async getSensitiveData(key: string): Promise<any | null> {
    const data = await this.encryptedStorage.get(key, this.userKey);
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * Remove sensitive data
   */
  removeSensitiveData(key: string): void {
    this.encryptedStorage.remove(key);
  }

  /**
   * Clear all sensitive data
   */
  clearAllSensitiveData(): void {
    this.encryptedStorage.clear();
  }
}

/**
 * Utility for encrypting data before API transmission
 */
export class APIDataEncryption {
  private static instance: APIDataEncryption;
  private serverPublicKey?: CryptoKey;

  static getInstance(): APIDataEncryption {
    if (!APIDataEncryption.instance) {
      APIDataEncryption.instance = new APIDataEncryption();
    }
    return APIDataEncryption.instance;
  }

  /**
   * Set the server's public key for encryption
   */
  async setServerPublicKey(publicKeyJwk: JsonWebKey): Promise<void> {
    this.serverPublicKey = await window.crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    );
  }

  /**
   * Encrypt sensitive data for API transmission
   */
  async encryptForAPI(data: any): Promise<string> {
    if (!this.serverPublicKey) {
      throw new Error('Server public key not set');
    }

    const jsonData = JSON.stringify(data);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(jsonData);

    const encrypted = await window.crypto.subtle.encrypt(
      'RSA-OAEP',
      this.serverPublicKey,
      encodedData
    );

    return arrayBufferToBase64(encrypted);
  }

  /**
   * Prepare encrypted payload for API request
   */
  async prepareSecurePayload(sensitiveData: any, metadata: any = {}): Promise<{
    encrypted_data: string;
    metadata: any;
    timestamp: string;
    integrity_hash: string;
  }> {
    const encrypted_data = await this.encryptForAPI(sensitiveData);
    const timestamp = new Date().toISOString();
    
    // Create integrity hash
    const payload = JSON.stringify({ encrypted_data, metadata, timestamp });
    const integrity_hash = await hashData(payload);

    return {
      encrypted_data,
      metadata,
      timestamp,
      integrity_hash
    };
  }
}

/**
 * Field-level encryption for form inputs
 */
export function createEncryptedField(fieldName: string) {
  let encryptedValue: string | null = null;
  let isEncrypted = false;

  return {
    encrypt: async (value: string, key: CryptoKey) => {
      if (value) {
        const { encrypted, iv } = await encrypt(value, key);
        encryptedValue = JSON.stringify({
          data: arrayBufferToBase64(encrypted),
          iv: arrayBufferToBase64(iv.buffer)
        });
        isEncrypted = true;
      }
    },
    
    decrypt: async (key: CryptoKey): Promise<string | null> => {
      if (!encryptedValue || !isEncrypted) return null;
      
      try {
        const { data, iv } = JSON.parse(encryptedValue);
        const encryptedData = base64ToArrayBuffer(data);
        const ivArray = new Uint8Array(base64ToArrayBuffer(iv));
        
        return await decrypt(encryptedData, key, ivArray);
      } catch (error) {
        console.error('Field decryption failed:', error);
        return null;
      }
    },
    
    getEncryptedValue: () => encryptedValue,
    isEncrypted: () => isEncrypted,
    clear: () => {
      encryptedValue = null;
      isEncrypted = false;
    }
  };
}

/**
 * Global instances
 */
export const encryptedLocalStorage = new EncryptedLocalStorage();
export const encryptedSessionStorage = new EncryptedSessionStorage();
export const apiEncryption = APIDataEncryption.getInstance();