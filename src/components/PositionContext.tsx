import React, { useState, useEffect } from "react";
import { gql, useQuery } from "@apollo/client";
import { useActiveAccount } from "thirdweb/react";
import { TOREX_USDC_cBTCx_ADDRESS } from "@/constants/contracts";

// Define the shape of a stream
interface PoolMember {
  id: string;
  units: string;
  isConnected: boolean;
  totalAmountClaimed: string;
  totalAmountReceivedUntilUpdatedAt: string;
  poolTotalAmountDistributedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  updatedAtBlockNumber: string;
  syncedPerUnitSettledValue: string;
  syncedPerUnitFlowRate: string;
  account: {
    id: string;
    outflows: {
      deposit: string;
      currentFlowRate: string;
      createdAtTimestamp: string;
      token: {
        symbol: string;
        name: string;
      };
    }[];
    poolMemberships: {
      totalAmountClaimed: string;
      pool: {
        token: {
          symbol: string;
          name: string;
        };
        perUnitSettledValue: bigint;
      };
    }[];
  };
}

// Define the shape of the position data
interface PositionData {
  pools: {
    id: string;
    poolMembers: PoolMember[];
  }[];
}

// Define the shape of the context value
interface PositionContextValue {
  positionData: PositionData | null;
  loading: boolean;
  error: any;
  refetchWithDelay: (delayMs: number) => void;
}

// Define the GraphQL query
const POSITION_QUERY = gql`
  query GetPosition($poolAdmin: String!, $account: String!) {
    pools(where: { admin: $poolAdmin }) {
      id
      poolMembers(where: { account: $account }) {
        id
        units
        isConnected
        totalAmountClaimed
        totalAmountReceivedUntilUpdatedAt
        poolTotalAmountDistributedUntilUpdatedAt
        updatedAtTimestamp
        updatedAtBlockNumber
        syncedPerUnitSettledValue
        syncedPerUnitFlowRate
        account {
          id
          outflows {
            deposit
            currentFlowRate
            createdAtTimestamp
            token {
              symbol
              name
            }
          }
          poolMemberships {
            totalAmountClaimed
            pool {
              perUnitSettledValue
              token {
                symbol
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const usePosition = () => {
  const account = useActiveAccount();
  console.log("account:", account);
  console.log("address:", account?.address);
  const { data, loading, error, refetch } = useQuery<PositionData>(
    POSITION_QUERY,
    {
      variables: {
        poolAdmin: TOREX_USDC_cBTCx_ADDRESS.toLowerCase(),
        account: account?.address?.toLowerCase(),
      },
      skip: !account?.address,
    }
  );

  const refetchWithDelay = (delayMs: number) => {
    const timeoutId = setTimeout(() => {
      refetch({
        poolAdmin: TOREX_USDC_cBTCx_ADDRESS,
        account: account?.address?.toLowerCase(),
      });
    }, delayMs);

    return () => clearTimeout(timeoutId);
  };

  return {
    positionData: data || null,
    loading,
    error,
    refetchWithDelay,
  };
};
