import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit";
import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_URL, NFT_ADDRESS } from "../../config";
import { allowedOrigin } from "../../lib/origin";
import { kv } from "@vercel/kv";
import { getFrameHtml } from "../../lib/getFrameHtml";
import { Session } from "../../lib/types";
import {
  errorResponse,
  noRecastResponse,
  verifiedAccounts,
} from "../../lib/responses";
import signMintData from "../../lib/signMint";
import {
  checkTransactionIdStatus,
  syndicateCallForSigMint,
} from "../../lib/syndicateCall";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    const isRecasted = message.recasted;
    if (!isRecasted) {
      return noRecastResponse();
    }
    const fid = message.interactor.fid;
    const address = message.interactor.verified_accounts[0].toLowerCase();

    if (address) {
      const fid = message.interactor.fid;
      let session = ((await kv.get(`session:${fid}`)) ?? {}) as Session;
      const { address, transactionId, checks, retries } = session;
      const totalChecks = checks ?? 0;
      const totalRetries = retries ?? 0;

      // If we've retried 3 times, give up
      // if (totalRetries > 2) {
      //   console.error("retries exceeded");
      //   return errorResponse();
      // }
      console.log("session", session);
      // If we've not checked 3 times, try to mint again
      if (totalChecks > 3 && session.address) {
        const { address } = session;
        const sig = await signMintData({
          to: address,
          tokenId: 1,
          fid,
        });

        const res = await syndicateCallForSigMint(
          body.trustedData.messageBytes,
          address,
          fid,
          sig,
        );
        if (res.status === 200) {
          const {
            success,
            data: { transactionId },
          } = await res.json();

          if (success) {
            session = {
              ...session,
              transactionId,
              checks: 0,
              retries: totalRetries + 1,
            };
            await kv.set(`session:${fid}`, session);
            const res = await checkTransactionIdStatus(transactionId);

            if (res.status === 200) {
              return new NextResponse(
                getFrameHtml({
                  buttons: [
                    {
                      label: "🔄 Check status",
                    },
                  ],
                  post_url: `${NEXT_PUBLIC_URL}/api/check`,
                  image: `${NEXT_PUBLIC_URL}/api/images/check`,
                }),
              );
            }
          }
        }
        return errorResponse();
      }
      // If we have a transactionId, check the status
      if (transactionId) {
        await kv.set(`session:${fid}`, {
          ...session,
          checks: totalChecks + 1,
        });
        console.log("checking transactionId", transactionId);
        const res = await checkTransactionIdStatus(transactionId);

        if (res.status === 200) {
          const {
            data: { transactionHash },
          } = await res.json();
          if (transactionHash) {
            await kv.set(`session:${fid}`, {
              ...session,
              transactionHash,
            });
            return new NextResponse(
              getFrameHtml({
                buttons: [
                  {
                    label: "Transaction",
                    action: "link",
                    target: `https://explorer-frame.syndicate.io/tx/${transactionHash}`,
                  },
                ],
                image: `${NEXT_PUBLIC_URL}/api/images/success?address=${address}`,
              }),
            );
          } else {
            return new NextResponse(
              getFrameHtml({
                buttons: [
                  {
                    label: "🔄 Check status",
                  },
                ],
                post_url: `${NEXT_PUBLIC_URL}/api/check`,
                image: `${NEXT_PUBLIC_URL}/api/images/check`,
              }),
            );
          }
        }
      }
      // If we don't have a transactionId, mint
      console.error;
      return errorResponse();
    } else {
      return verifiedAccounts(fid);
    }
  } else return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
