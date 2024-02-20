import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit";
import { NextRequest, NextResponse } from "next/server";

import {
  NEXT_PUBLIC_URL,
  PHI_COLLECTION_ADDRESS,
  PHI_TOKEN_ID,
} from "../../config";
import { getAddressButtons } from "../../lib/addresses";
import { allowedOrigin } from "../../lib/origin";
import { kv } from "@vercel/kv";
import { getFrameHtml } from "../../lib/getFrameHtml";
import { LandResponse, Session } from "../../lib/types";
import { mintResponse } from "../../lib/responses";
import { retryableApiPost } from "../../lib/retry";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });
  console.log("isValid", isValid, "message", message);
  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    // const isActive = message.raw.action.interactor.active_status === "active";
    const address = message.interactor.verified_accounts[0].toLowerCase();

    if (address) {
      const fid = message.interactor.fid;
      const { transactionId, transactionHash } = ((await kv.get(
        `session:${fid}`,
      )) ?? {}) as Session;
      if (transactionHash) {
        // Already minted
        return new NextResponse(
          getFrameHtml({
            buttons: [
              {
                label: `Transaction`,
                action: "link",
                target: `https://basescan.org/tx/${transactionHash}`,
              },
              {
                label: "Mint",
                action: "mint",
                target: `eip155:8453:${PHI_COLLECTION_ADDRESS}:${PHI_TOKEN_ID}`,
              },
            ],
            image: `${NEXT_PUBLIC_URL}/api/images/claimed`,
          }),
        );
      } else if (transactionId) {
        // Mint in queue
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
      } else {
        const buttons = getAddressButtons(message.interactor);
        return new NextResponse(
          getFrameHtml({
            buttons,
            image: `${NEXT_PUBLIC_URL}/api/images/select`,
            post_url: `${NEXT_PUBLIC_URL}/api/confirm`,
          }),
        );
      }
    } else {
      return mintResponse();
    }
  } else return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
