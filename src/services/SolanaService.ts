import {Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction} from "@solana/web3.js";
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";
import axios, {AxiosInstance} from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import {Account, getAccount, getAssociatedTokenAddressSync, getMint, NATIVE_MINT} from "@solana/spl-token";
import {Key} from "../types";

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

type JupiterSwapResponse = {
    swapTransaction: string;
}

export enum BuyErrorMessage {
    INSUFFICIENT_BALANCE
}

type BuyResponse = BuyError | BuySuccess;

type BuyError = {
    success: false;
    error: BuyErrorMessage;
}

type BuySuccess = {
    success: true;
    amountBought: string;
}

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
        const tokenMintPubkey = new PublicKey(tokenAddress);
        const mintAccount = await getMint(this.connection, tokenMintPubkey);
        this.logger.info(`Found mint address for token ${tokenAddress}`, { decimals: mintAccount.decimals });
        const decimals = mintAccount.decimals;
        return (Number(tokenAmount)/decimals).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    async buySolanaAsset(assetAddress: string, amountInLamports: string, userKey: Key): Promise<BuyResponse> {
        this.logger.info(`Buying ${amountInLamports} lamps of ${assetAddress}`);
        const humanFriendlySOLBalance = await this.getHumanFriendlySOLBalance(userKey.publicKey);
        if (Number(humanFriendlySOLBalance) <= Number(amountInLamports)) {
            return {
                success: false,
                error: BuyErrorMessage.INSUFFICIENT_BALANCE,
            }
        }
        const { data: quoteResponse } = await this.jupiterAxios.get<JupiterQuotesResponse>("quote", {
            params: {
                inputMint: NATIVE_MINT,
                outputMint: assetAddress,
                amount: amountInLamports,
                autoSlippage: true,
                maxAutoSlippageBps: 1_000, // 10%
            }
        });
        this.logger.info(`Received quotes response: `, { quoteResponse });
        const swapResponse = await this.jupiterAxios.post<JupiterSwapResponse>("swap", {
            quoteResponse,
            userPublicKey: userKey.publicKey,
            wrapAndUnwrapSol: true,
        });
        this.logger.info(`Received Jupiter Swap Response: `, { response: swapResponse.data });
        const swapTransactionBuf = Buffer.from(swapResponse.data.swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        this.logger.info(`Serialised transaction: `, { transaction });
        const wallet = Keypair.fromSecretKey(userKey.privateKey);
        transaction.sign([wallet]);
        this.logger.info(`Signed transaction: `, { signatures: transaction.signatures });
        const txSignature = await this.connection.sendTransaction(transaction);
        this.logger.info(`Sent signature: `, { txSignature });
        return {
            success: true,
            amountBought: quoteResponse.outAmount,
        };
    }

    async getTokenAccount(assetAddress: string, userAddress: string): Promise<Account> {
        const tokenAccountAddress = getAssociatedTokenAddressSync(new PublicKey(assetAddress), new PublicKey(userAddress));
        this.logger.info(`Found token address: ${tokenAccountAddress}`);
        const tokenAccount = await getAccount(this.connection, tokenAccountAddress);
        this.logger.info(`Found token account: `, { tokenAccount });
        return tokenAccount;
    }
}