import { NextResponse } from "next/server";
import { NEXT_PUBLIC_URL, NFT_ADDRESS } from "../config";
import { getFrameHtml } from "./getFrameHtml";

export function errorResponse() {
  return new NextResponse(
    getFrameHtml({
      image: `${NEXT_PUBLIC_URL}/api/images/error`,
    }),
  );
}

export async function noRecastResponse() {
  return new NextResponse(
    getFrameHtml({
      image: `${NEXT_PUBLIC_URL}/api/images/inactive`,
    }),
  );
}

export function verifiedAccounts(fid: number) {
  return new NextResponse(
    getFrameHtml({
      buttons: [
        {
          label: "Verify Account",
          action: "link",
          target: `https://verify.warpcast.com/verify/${fid}`,
        },
      ],
      image: `${NEXT_PUBLIC_URL}/api/images/verify`,
    }),
  );
}
