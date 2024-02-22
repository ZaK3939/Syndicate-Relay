// export const NEXT_PUBLIC_URL = "https://mint.farcaster.xyz";
export const NEXT_PUBLIC_URL =
  "https://a-frame-in-100-lines-seven-khaki.vercel.app";

export const ALLOWED_ORIGIN = "a-frame-in-100-lines-seven-khaki.vercel.app";
/* The line `const ALLOWED_ORIGIN = "test-frame-zak3939.vercel.app";` is assigning the value
"test-frame-zak3939.vercel.app" to the constant variable `ALLOWED_ORIGIN`. This variable is likely
used to specify a specific origin that is allowed to access resources or interact with the code in
some way. This can be useful for security purposes to restrict access to certain origins or domains. */
// export const ALLOWED_ORIGIN = "test-frame-zak3939.vercel.app";
// export const MINTER_CONTRACT = "0xcf2db0c4abeafc2e1af552979f380c965f63783e";
// export const PHI_COLLECTION_ADDRESS =
//   "0xe6f3c7d5c7eca259ace70013dfc1ee77d8388acd";
export const PHI_COLLECTION_ADDRESS =
  "0x601B0206c70182bFC31306cB3D487433a2A67007";

export const PHI_TOKEN_ID = "1";

export const CARD_DIMENSIONS = {
  width: 800,
  height: 800,
};

export const TOKEN_IMAGE = `${NEXT_PUBLIC_URL}/horse.png`;

export const PHI_GRAPH = `https://graph-api.phi.blue/graphql`;

export function queryForLand(address: string) {
  return `query philandList { philandList(input: {address: "${address}" transparent: false}) { data { name landurl imageurl } } }`;
}
