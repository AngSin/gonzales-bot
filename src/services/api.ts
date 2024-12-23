import axios, { AxiosInstance } from "axios";
import {DexScreenerSearchResponse, Pair} from "../types";

export default class DexscreenerService {
    readonly axios: AxiosInstance = axios.create({
        baseURL: "https://api.dexscreener.com/latest/dex/",
    });

    async searchAndRetrievePair(tickerOrAddress: string): Promise<Pair> {
        const searchResponse = await this.axios.get<DexScreenerSearchResponse>(`search`, { params: { q: tickerOrAddress } });
        return searchResponse.data.pairs.reduce((highest, current) => {
            return current.liquidity && highest.liquidity && current.liquidity.usd > highest.liquidity.usd ? current : highest;
        }, searchResponse.data.pairs[0]);
    }
}