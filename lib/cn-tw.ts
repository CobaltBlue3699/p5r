import { Converter } from 'opencc-js';

const cnToTw = Converter({ from: 'cn', to: 'tw' });
const twToCn = Converter({ from: 'tw', to: 'cn' });

export function toTW(text: string): string {
  return cnToTw(text);
}

export function toCN(text: string): string {
  return twToCn(text);
}

export function toBoth(text: string): [string, string] {
  return [toCN(text), toTW(text)];
}
