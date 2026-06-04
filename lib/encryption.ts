// lib/encryption.ts

export function encrypt(data: any): string {
  return btoa(JSON.stringify(data));
}

export function decrypt(cipher: string): any {
  return JSON.parse(atob(cipher));
}
