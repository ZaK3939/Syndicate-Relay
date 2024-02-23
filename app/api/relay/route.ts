import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_URL, PHI_GRAPH, queryForLand } from "../../config";
import { getAddressButtons } from "../../lib/addresses";
import signMintData from "../../lib/signMint";
import { allowedOrigin } from "../../lib/origin";
import { getFrameHtml } from "../../lib/getFrameHtml";
import { errorResponse, mintResponse } from "../../lib/responses";
import { LandResponse, Session } from "../../lib/types";
import { retryableApiPost } from "../../lib/retry";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (isValid && allowedOrigin(message)) {
    if (message.button === 1) {
      const buttons = getAddressButtons(message.interactor);
      return new NextResponse(
        getFrameHtml({
          buttons,
          image: `${NEXT_PUBLIC_URL}/api/images/select`,
          post_url: `${NEXT_PUBLIC_URL}/api/confirm`,
        }),
      );
    }

    const fid = message.interactor.fid;
    let session = ((await kv.get(
      `session:${fid}:$${process.env.PHI_COLLECTION_ADDRESS}`,
    )) ?? {}) as Session;
    console.log("message.interactor", message.interactor);

    if (session?.address) {
      const { address } = session;
      const sig = await signMintData({
        to: address,
        tokenId: 1,
        fid,
      });
      console.log("body.trustedData", body.trustedData);

      try {
        let functionSignature = "mint(address to)";
        const postData = JSON.stringify({
          frameTrustedData: body.trustedData.messageBytes,
          // contractAddress: "0x3221679c531bcf7eb4f728bbad3f4301d2e2d640",
          contractAddress: `${process.env.PHI_COLLECTION_ADDRESS}`,
          functionSignature: functionSignature,
          args: { to: "{frame-user}" },
        });
        const res = await fetch(
          "https://frame.syndicate.io/api/v2/sendTransaction",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
            },
            body: postData,
          },
        );
        console.log("postData", postData);
        if (!res.ok) {
          // Try to read the response body and include it in the error message
          const errorBody = await res.text();
          throw new Error(
            `Syndicate Frame API HTTP error! Status: ${res.status}, Body: ${errorBody}`,
          );
        }

        console.log("response syndicate frame", res);

        if (res.status === 200) {
          const {
            success,
            data: { transactionId },
          } = await res.json();
          if (success) {
            console.log("transactionId", transactionId);
            session = { ...session, transactionId };
            await kv.set(
              `session:${fid}:$${process.env.PHI_COLLECTION_ADDRESS}`,
              session,
            );
            const res = await fetch(
              `https://frame.syndicate.io/api/v2/transaction/${transactionId}/hash`,
              {
                headers: {
                  "content-type": "application/json",
                  Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
                },
              },
            );
            if (res.status === 200) {
              console.log(
                "res",
                res,
                `https://frame.syndicate.io/api/v2/transaction/${transactionId}/hash`,
                "go to check",
              );
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
      return mintResponse();
    }
  } else return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
