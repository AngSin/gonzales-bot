import axios from "axios";
import {DexScreenerSearchResponse, Pair} from "./types";

const dexscreenerBaseUrl = "https://api.dexscreener.com/latest/dex/"

export const searchAndRetrievePair = async (tickerOrAddress: string): Promise<Pair> => {
    const searchResponse = await axios.get<DexScreenerSearchResponse>(`${dexscreenerBaseUrl}search?q=${tickerOrAddress}`);
    return searchResponse.data.pairs.reduce((highest, current) => {
        return current.liquidity && highest.liquidity && current.liquidity.usd > highest.liquidity.usd ? current : highest;
    }, searchResponse.data.pairs[0]);
};