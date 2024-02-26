import {
  FrameRequest,
  getFrameMessage,
  FrameValidationData,
} from "@coinbase/onchainkit";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_URL, NFT_ADDRESS } from "../../config";
import { getAddresses } from "../../lib/addresses";
import { allowedOrigin } from "../../lib/origin";
import { getFrameHtml } from "../../lib/getFrameHtml";
import { noRecastResponse, verifiedAccounts } from "../../lib/responses";

function validButton(message?: FrameValidationData) {
  return message?.button && message?.button > 0 && message?.button < 5;
}

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (isValid && validButton(message) && allowedOrigin(message)) {
    const isRecasted = message.recasted;
    if (!isRecasted) {
      return noRecastResponse();
    }
    const fid = message.interactor.fid;
    const addresses = getAddresses(message.interactor);
    const address = addresses[message.button - 1];
    if (!address) {
      return verifiedAccounts(fid);
    }
    await kv.set(`session:${fid}`, {
      address,
    });

    return new NextResponse(
      getFrameHtml({
        buttons: [{ label: "✅ Mint" }],
        image: `${NEXT_PUBLIC_URL}/api/images/confirm?address=${address}`,
        post_url: `${NEXT_PUBLIC_URL}/api/relay`,
      }),
    );
  } else return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
