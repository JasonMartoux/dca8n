"use client";

import { Navbar } from "@/components/Navbar";
import { CreateStreamForm } from "../components/CreateStreamForm";
import { StreamList } from "../components/StreamList";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/appoloClient";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4">
        <ApolloProvider client={apolloClient}>
          <CreateStreamForm />
          <StreamList />
        </ApolloProvider>
      </div>
    </>
  );
}
