import {Connection, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";

export default class SolanaService {
    readonly connection: Connection = new Connection(getMandatoryEnvVariable("SOLANA_RPC_URL"));

    async getHumanFriendlyBalance(pubkey: string): Promise<string> {
        const balanceInLamports = await this.connection.getBalance(new PublicKey(pubkey));
        const balanceInSOL = balanceInLamports/LAMPORTS_PER_SOL;
        return balanceInSOL.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
}