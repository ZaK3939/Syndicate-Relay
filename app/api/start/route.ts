import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';

import { NEXT_PUBLIC_URL, PHI_GRAPH, ZORA_COLLECTION_ADDRESS, ZORA_TOKEN_ID } from '../../config';
import { getAddressButtons } from '../../lib/addresses';
import { allowedOrigin } from '../../lib/origin';
import { kv } from '@vercel/kv';
import { getFrameHtml } from '../../lib/getFrameHtml';
import { LandResponse, Session } from '../../lib/types';
import { mintResponse } from '../../lib/responses';
import { retryableApiPost } from '../../lib/retry';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });
  console.log('isValid', isValid, 'message', message);
  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    const isActive = message.raw.action.interactor.active_status === 'active';
    // const query = `
    //   query {
    //   philandList
    //     (input:
    //       {address: "0x5037e7747fAa78fc0ECF8DFC526DcD19f73076ce", transparent: false})
    //         { data { name landurl imageurl }
    //       }
    // }`;
    console.log('message', message);
    const address = '0x5037e7747fAa78fc0ECF8DFC526DcD19f73076ce';
    const query = `query philandList { philandList(input: {address: "${address}" transparent: false}) { data { name landurl imageurl } } }`;
    const result = await retryableApiPost<LandResponse>(PHI_GRAPH, query);
    console.log('result', result);
    if (isActive || (result.data && result.data.philandList.data)) {
      const fid = message.interactor.fid;
      const landName = result.data!.philandList.data[0].name;
      const { transactionId, transactionHash } = ((await kv.get(`session:${fid}`)) ??
        {}) as Session;
      if (transactionHash) {
        // Already minted
        return new NextResponse(
          getFrameHtml({
            buttons: [
              {
                label: `Transaction ${landName}`,
                action: 'link',
                target: `https://basescan.org/tx/${transactionHash}`,
              },
              {
                label: 'Mint',
                action: 'mint',
                target: `eip155:8453:${ZORA_COLLECTION_ADDRESS}:${ZORA_TOKEN_ID}`,
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
                label: '🔄 Check status',
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
  } else return new NextResponse('Unauthorized', { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
