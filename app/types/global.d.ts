interface Window {
  Buffer: typeof Buffer;
  process?: {
    env: {
      NODE_ENV: string;
      [key: string]: string;
    };
  };
  arioConfig?: {
    debugMode: boolean;
    fetchTimeout: number;
  };
  arweaveWallet?: ArweaveWallet;
}

declare module 'buffer' {
  export const Buffer: typeof global.Buffer;
}

interface ArweaveWallet {
  connect: (permissions: string[]) => Promise<void>;
  disconnect: () => Promise<void>;
  getActiveAddress: () => Promise<string>;
  getAllAddresses: () => Promise<string[]>;
  getActivePublicKey: () => Promise<string>;
  sign: (transaction: unknown, options?: object) => Promise<unknown>;
  signature: (data: Uint8Array, options?: object) => Promise<unknown>;
  encrypt: (data: Uint8Array, options?: any) => Promise<Uint8Array>;
  decrypt: (data: Uint8Array, options?: any) => Promise<Uint8Array>;
  getPermissions: () => Promise<string[]>;
  getArweaveConfig: () => Promise<{
    host: string;
    port: number;
    protocol: string;
  }>;
  addToken: (id: string) => Promise<void>;
  dispatch: (action: string, data?: any) => Promise<any>;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_ARWEAVE_GATEWAY: string;
  }
} 