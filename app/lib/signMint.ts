import { Hex, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { NFT_ADDRESS } from "../config";

const SIGNER_PRIVATE_KEY = (process.env.SIGNER_PRIVATE_KEY ?? "0x00") as Hex;
const MINTER_CONTRACT = NFT_ADDRESS;

const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

// const chainId = base.id;
const syndicateChainId = 5101; //For Syndicate

const domain = {
  name: "DEMO FARCASTER NFT MINT",
  version: "1",
  chainId: syndicateChainId,
  verifyingContract: MINTER_CONTRACT,
} as const;

export const types = {
  Mint: [
    { name: "to", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "fid", type: "uint256" },
  ],
} as const;

interface MintData {
  to: Hex;
  tokenId: number;
  fid: number;
}

async function signMintData(mintData: MintData): Promise<Hex> {
  return account.signTypedData({
    domain,
    types,
    primaryType: "Mint",
    message: {
      to: mintData.to,
      tokenId: BigInt(mintData.tokenId),
      fid: BigInt(mintData.fid),
    },
  });
}

export default signMintData;
