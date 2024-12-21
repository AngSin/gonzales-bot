export type DexScreenerSearchResponse = {
    schemaVersion: string;
    pairs: Pair[];
};

export type Pair = {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    labels: string[];
    baseToken: Token;
    quoteToken: Token;
    priceNative: string;
    priceUsd: string;
    txns: Txns;
    volume: Volume;
    priceChange: PriceChange;
    liquidity?: Liquidity;
    fdv: number;
    marketCap: number;
    pairCreatedAt: number;
    info: Info;
};

type Token = {
    address: string;
    name: string;
    symbol: string;
};

type Txns = {
    m5: TransactionData;
    h1: TransactionData;
    h6: TransactionData;
    h24: TransactionData;
};

type TransactionData = {
    buys: number;
    sells: number;
};

type Volume = {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
};

type PriceChange = {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
};

type Liquidity = {
    usd: number;
    base: number;
    quote: number;
};

type Info = {
    imageUrl: string;
    header: string;
    openGraph: string;
    websites: string[];
    socials: Social[];
};

type Social = {
    type: string;
    url: string;
};
