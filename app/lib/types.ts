import { Hex } from 'viem';

export interface Session {
  address?: Hex;
  transactionId?: string;
  transactionHash?: string;
  checks?: number;
  retries?: number;
}

type Land = {
  name: string;
  landurl: string;
  imageurl: string;
};

export interface LandResponse {
  data?: {
    philandList: {
      data: Land[];
    };
  };
  error?: Error;
}
