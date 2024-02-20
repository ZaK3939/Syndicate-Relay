import { NextResponse } from "next/server";
import {
  NEXT_PUBLIC_URL,
  PHI_COLLECTION_ADDRESS,
  PHI_TOKEN_ID,
} from "../config";
import { getFrameHtml } from "./getFrameHtml";

export function errorResponse() {
  return new NextResponse(
    getFrameHtml({
      image: `${NEXT_PUBLIC_URL}/api/images/error`,
    }),
  );
}

export async function mintResponse() {
  return new NextResponse(
    getFrameHtml({
      buttons: [
        {
          label: "Mint",
          action: "mint",
          target: `eip155:8453:${PHI_COLLECTION_ADDRESS}:${PHI_TOKEN_ID}`,
        },
      ],
      image: `${NEXT_PUBLIC_URL}/api/images/inactive`,
    }),
  );
}
