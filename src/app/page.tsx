"use client";

import { Navbar } from "@/components/Navbar";
import { CreateStreamForm } from "../components/CreateStreamForm";
import { StreamList } from "../components/StreamList";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/appoloClient";
import { useActiveAccount } from "thirdweb/react";

export default function Home() {
  const account = useActiveAccount();
  console.log("account:", account?.address);
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4">
        <ApolloProvider client={apolloClient}>
          {account && account.address ? (
            <>
              <CreateStreamForm />
              <StreamList />
            </>
          ) : (
            <p>Please connect your wallet to view your streams.</p>
          )}
        </ApolloProvider>
      </div>
    </>
  );
}
