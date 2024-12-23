import {Connection, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";
import axios, {AxiosInstance} from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import {getMint, NATIVE_MINT} from "@solana/spl-token";


type SwapMode = "ExactIn" | "ExactOut";

type JupiterQuotesResponse = {
    inputMint: string; // Address of the input mint
    inAmount: string; // Amount in lamports (string to handle large numbers)
    outputMint: string; // Address of the output mint
    outAmount: string; // Output amount in lamports (string to handle large numbers)
    otherAmountThreshold: string; // Threshold amount in lamports (string to handle large numbers)
    swapMode: SwapMode; // Swap mode, constrained to specific string values
    slippageBps: number; // Basis points for slippage
    priceImpactPct: string; // Percentage of price impact (string for precision)
    contextSlot: number; // Slot number for context
};


type BuyResponse = {
  amountBought: string;
};

export default class SolanaService {
    readonly connection: Connection = new Connection(getMandatoryEnvVariable("SOLANA_RPC_URL"));
    readonly jupiterAxios: AxiosInstance = axios.create({
        baseURL: "https://quote-api.jup.ag/v6/",
    });
    readonly logger: Logger = new Logger({ serviceName: 'SolanaService' });

    async getHumanFriendlySOLBalance(pubkey: string): Promise<string> {
        const balanceInLamports = await this.connection.getBalance(new PublicKey(pubkey));
        const balanceInSOL = balanceInLamports/LAMPORTS_PER_SOL;
        return balanceInSOL.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    async getHumanFriendlyTokenBalance(tokenAddress: string, tokenAmount: string): Promise<string> {
        this.logger.info(`Fetching mint account for ${tokenAddress}`);
        const mintAccount = await getMint(this.connection, new PublicKey(tokenAddress));
        this.logger.info(`Found mint address for token ${tokenAddress}`, { mintAccount });
        const decimals = mintAccount.decimals;
        return (Number(tokenAmount)/decimals).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    async buySolanaAsset(assetAddress: string, amountInSOL: string): Promise<BuyResponse> {
        this.logger.info(`Buying ${amountInSOL} SOL of ${assetAddress}`);
        const amountInLamports = Number(amountInSOL) * LAMPORTS_PER_SOL;
        const { data: quoteResponse } = await this.jupiterAxios.get<JupiterQuotesResponse>("quote", {
            params: {
                inputMint: NATIVE_MINT,
                outputMint: assetAddress,
                amount: amountInLamports,
                slippageBps: 1,
            }
        });
        this.logger.info(`Received quotes response: `, { quoteResponse });
        const amountBought = await this.getHumanFriendlyTokenBalance(quoteResponse.outputMint, quoteResponse.outAmount);
        return {
            amountBought
            // amountBought: quoteResponse.outAmount
        };
    }
}