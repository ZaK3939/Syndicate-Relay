import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit";
import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_URL, NFT_ADDRESS } from "../../config";
import { getAddressButtons } from "../../lib/addresses";
import { allowedOrigin } from "../../lib/origin";
import { kv } from "@vercel/kv";
import { getFrameHtml } from "../../lib/getFrameHtml";
import { Session } from "../../lib/types";
import { noRecastResponse, verifiedAccounts } from "../../lib/responses";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });
  console.log("isValid", isValid, "message", message);
  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    const address = message.interactor.verified_accounts[0].toLowerCase();
    const fid = message.interactor.fid;
    if (address) {
      const { transactionId, transactionHash } = ((await kv.get(
        `session:${fid}:${NFT_ADDRESS}`,
      )) ?? {}) as Session;
      if (transactionHash) {
        // Already minted
        return new NextResponse(
          getFrameHtml({
            buttons: [
              {
                label: `Transaction`,
                action: "link",
                target: `https://explorer-frame.syndicate.io/tx/${transactionHash}`,
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
        const isRecasted = message.recasted;
        if (!isRecasted) {
          return noRecastResponse();
        }
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
      return verifiedAccounts(fid);
    }
  } else return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
