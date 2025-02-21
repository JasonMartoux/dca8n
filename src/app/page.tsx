"use client";

import { Navbar } from "@/components/Navbar";
import { CreateStreamForm } from "../components/CreateStreamForm";
import { StreamList } from "../components/StreamList";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/appoloClient";
import { useActiveAccount } from "thirdweb/react";
import { BaseForm } from "@/components/BaseForm";

export default function Home() {
  const account = useActiveAccount();
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4">
        <ApolloProvider client={apolloClient}>
          {account && account.address ? (
            <>
              {/* <CreateStreamForm /> */}
              <BaseForm account={account} />
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
