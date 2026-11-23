/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'mammoth/mammoth.browser' {
  interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface MammothModule {
    convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<MammothResult>;
    extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<MammothResult>;
  }

  const mammoth: MammothModule;
  export default mammoth;
}
