// export const NEXT_PUBLIC_URL = 'https://mint.farcaster.xyz';
export const NEXT_PUBLIC_URL = "https://test-frame-zak3939.vercel.app";

// export const ALLOWED_ORIGIN = 'mint.farcaster.xyz';
export const ALLOWED_ORIGIN = "test-frame-zak3939.vercel.app";
// export const MINTER_CONTRACT = "0xcf2db0c4abeafc2e1af552979f380c965f63783e";
export const PHI_COLLECTION_ADDRESS =
  "0xE6EdA4222776097641227BB30EfC583A71a44b62d";
export const PHI_TOKEN_ID = "1";

export const CARD_DIMENSIONS = {
  width: 800,
  height: 800,
};

export const TOKEN_IMAGE = `${NEXT_PUBLIC_URL}/park-1.png`;

export const PHI_GRAPH = `https://graph-api.phi.blue/graphql`;

export function queryForLand(address: string) {
  return `query philandList { philandList(input: {address: "${address}" transparent: false}) { data { name landurl imageurl } } }`;
}
