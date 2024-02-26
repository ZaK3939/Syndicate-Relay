import { getFrameMetadata } from "@coinbase/onchainkit";
import type { Metadata } from "next";
import { NEXT_PUBLIC_URL, NFT_ADDRESS } from "./config";

export async function generateMetadata(): Promise<Metadata> {
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: "Check eligibility",
      },
    ],
    image: `${NEXT_PUBLIC_URL}/api/images/start`,
    post_url: `${NEXT_PUBLIC_URL}/api/start`,
  });

  return {
    title: "Free Mint with Recast",
    description: "Check if you're eligible for a free mint",
    openGraph: {
      title: "Free Mint with Recast",
      description: "Check if you're eligible for a free mint",
      images: [`${NEXT_PUBLIC_URL}/api/images/start`],
    },
    other: {
      ...frameMetadata,
      "fc:frame:image:aspect_ratio": "1:1",
    },
  };
}

export default async function Page() {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-center min-h-screen items-start font-body">
        <div className="w-full md:w-1/4 flex flex-col items-center md:items-start space-y-4 mt-4 md:mt-0 md:pl-4">
          <div className="text-xs text-stone-400 hover:underline tracking-tighter text-center">
            <a href="xxx" target="_blank">
              See code on Github
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
