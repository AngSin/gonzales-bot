import {Connection, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";
import axios, {AxiosInstance} from "axios";
import {Logger} from "@aws-lambda-powertools/logger";

const WRAPPED_SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';

export default class SolanaService {
    readonly connection: Connection = new Connection(getMandatoryEnvVariable("SOLANA_RPC_URL"));
    readonly jupiterAxios: AxiosInstance = axios.create({
        baseURL: "https://quote-api.jup.ag/v6/",
    });
    readonly logger: Logger = new Logger({ serviceName: 'SolanaService' });

    async getHumanFriendlyBalance(pubkey: string): Promise<string> {
        const balanceInLamports = await this.connection.getBalance(new PublicKey(pubkey));
        const balanceInSOL = balanceInLamports/LAMPORTS_PER_SOL;
        return balanceInSOL.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    async buySolanaAsset(assetAddress: string, amountInSOL: string): Promise<string> {
        const amountInLamports = Number(amountInSOL) * LAMPORTS_PER_SOL;
        const quoteResponse = await this.jupiterAxios.get("quote", {
            params: {
                inputMint: WRAPPED_SOL_MINT_ADDRESS,
                outputMint: assetAddress,
                amount: amountInLamports,
                slippageBps: 1,
            }
        });
        this.logger.info(JSON.stringify(quoteResponse));
        return JSON.stringify(quoteResponse);
    }
}