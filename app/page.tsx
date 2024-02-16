import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';
import { NEXT_PUBLIC_URL } from './config';

export async function generateMetadata(): Promise<Metadata> {
  // const { name } = await getCollection();
  const name = 'zak3939';
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: 'Check eligibility',
      },
    ],
    image: `${NEXT_PUBLIC_URL}/api/images/start`,
    post_url: `${NEXT_PUBLIC_URL}/api/start`,
  });

  return {
    title: name,
    description: "Check if you're eligible for a free mint",
    openGraph: {
      title: name,
      description: "Check if you're eligible for a free mint",
      images: [`${NEXT_PUBLIC_URL}/api/images/start`],
    },
    other: {
      ...frameMetadata,
      'fc:frame:image:aspect_ratio': '1:1',
    },
  };
}

// const frameMetadata = getFrameMetadata({
//   buttons: [
//     {
//       label: 'Story time!',
//     },
//     {
//       action: 'link',
//       label: 'Link to Google',
//       target: 'https://www.google.com',
//     },
//     {
//       label: 'Redirect to pictures',
//       action: 'post_redirect',
//     },
//   ],
//   image: {
//     src: `${NEXT_PUBLIC_URL}/park-3.png`,
//     aspectRatio: '1:1',
//   },
//   input: {
//     text: 'Tell me a boat story',
//   },
//   postUrl: `${NEXT_PUBLIC_URL}/api/frame`,
// });

// export const metadata: Metadata = {
//   title: 'zizzamia.xyz',
//   description: 'LFG',
//   openGraph: {
//     title: 'zizzamia.xyz',
//     description: 'LFG',
//     images: [`${NEXT_PUBLIC_URL}/park-1.png`],
//   },
//   other: {
//     ...frameMetadata,
//   },
// };

export default function Page() {
  return (
    <>
      <h1>zak3939.phi</h1>
    </>
  );
}
