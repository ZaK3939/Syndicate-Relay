import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit";
import { NextRequest, NextResponse } from "next/server";
import { NEXT_PUBLIC_URL, PHI_GRAPH, queryForLand } from "../../config";
import { allowedOrigin } from "../../lib/origin";
import { kv } from "@vercel/kv";
import { getFrameHtml } from "../../lib/getFrameHtml";
import { Session } from "../../lib/types";
import { errorResponse, mintResponse } from "../../lib/responses";
import signMintData from "../../lib/signMint";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    // const isActive = message.raw.action.interactor.active_status === "active";
    const address = message.interactor.verified_accounts[0].toLowerCase();

    if (address) {
      const fid = message.interactor.fid;
      let session = ((await kv.get(
        `session:${fid}:$${process.env.PHI_COLLECTION_ADDRESS}`,
      )) ?? {}) as Session;
      const { address, transactionId, checks, retries } = session;
      const totalChecks = checks ?? 0;
      const totalRetries = retries ?? 0;

      console.log("session", session);
      // If we've retried 3 times, give up
      if (totalRetries > 2) {
        // console.error("retries exceeded");
        // return errorResponse();
      }

      // If we've not checked 3 times, try to mint again
      if (totalChecks > 3 && session.address) {
        const { address } = session;
        const sig = await signMintData({
          to: address,
          tokenId: 1,
          fid,
        });
        // const res = await fetch(
        //   "https://frame.syndicate.io/api/v2/sendTransaction",
        //   {
        //     method: "POST",
        //     headers: {
        //       "content-type": "application/json",
        //       Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
        //     },
        //     body: JSON.stringify({
        //       frameTrustedData: body.trustedData.messageBytes,
        //       contractAddress: process.env.MINER_CONTRACT_ADDRESS,
        //       functionSignature: "mint(address,uint256,uint256,bytes)",
        //       args: [address, 1, fid, sig],
        //     }),
        //   },
        // );
        let functionSignature = "mint(address to)";
        const postData = JSON.stringify({
          frameTrustedData: body.trustedData.messageBytes,
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
        console.log("response syndicate frame", res);
        if (res.status === 200) {
          const {
            success,
            data: { transactionId },
          } = await res.json();
          console.log("transactionId", success, transactionId);
          if (success) {
            session = {
              ...session,
              transactionId,
              checks: 0,
              retries: totalRetries + 1,
            };
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

            console.log(res);
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
      console.log("session", session);
      // If we have a transactionId, check the status
      if (transactionId) {
        await kv.set(`session:${fid}:$${process.env.PHI_COLLECTION_ADDRESS}`, {
          ...session,
          checks: totalChecks + 1,
        });
        const res = await fetch(
          `https://frame.syndicate.io/api/v2/transaction/${transactionId}/hash`,
          {
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
            },
          },
        );
        console.log(res, transactionId);
        if (res.status === 200) {
          const {
            data: { transactionHash },
          } = await res.json();
          if (transactionHash) {
            await kv.set(
              `session:${fid}:$${process.env.PHI_COLLECTION_ADDRESS}`,
              { ...session, transactionHash },
            );
            return new NextResponse(
              getFrameHtml({
                buttons: [
                  {
                    label: "Transaction",
                    action: "link",
                    target: `https://basescan.org/tx/${transactionHash}`,
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
      return mintResponse();
    }
  } else return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
