declare module 'opencc-js' {
  export function Converter(options: { from: 'cn' | 'tw' | 'hk' | 'jp'; to: 'cn' | 'tw' | 'hk' | 'jp' }): (text: string) => string;
  export const ConverterFactory: any;
  export const CustomConverter: any;
  export const HTMLConverter: any;
  export const Locale: any;
  export const Trie: any;
}
