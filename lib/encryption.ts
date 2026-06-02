import CryptoJS from "crypto-js";

const SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!;

export function encrypt(data: any) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET).toString();
}

export function decrypt(cipher: string) {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
