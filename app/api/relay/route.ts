import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_URL, NFT_ADDRESS } from "../../config";
import signMintData from "../../lib/signMint";
import { allowedOrigin } from "../../lib/origin";
import { getFrameHtml } from "../../lib/getFrameHtml";
import {
  errorResponse,
  noRecastResponse,
  verifiedAccounts,
} from "../../lib/responses";
import { Session } from "../../lib/types";
import {
  checkTransactionIdStatus,
  syndicateCallForSigMint,
} from "../../lib/syndicateCall";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (isValid && allowedOrigin(message)) {
    const isRecasted = message.recasted;
    if (!isRecasted) {
      return noRecastResponse();
    }
    const fid = message.interactor.fid;
    let session = ((await kv.get(`session:${fid}`)) ?? {}) as Session;

    if (session?.address) {
      try {
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
        if (!res.ok) {
          // Try to read the response body and include it in the error message
          const errorBody = await res.text();
          throw new Error(
            `Syndicate Frame API HTTP error! Status: ${res.status}, Body: ${errorBody}`,
          );
        }

        if (res.status === 200) {
          const {
            success,
            data: { transactionId },
          } = await res.json();
          if (success) {
            session = { ...session, transactionId };
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
      } catch (e) {
        console.error(e);
        return errorResponse();
      }
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
