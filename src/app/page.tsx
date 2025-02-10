"use client";

import { Navbar } from "@/components/Navbar";
import { CreateStreamForm } from "../components/CreateStreamForm";
import { StreamList } from "../components/StreamList";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4">
        {/* <CreateStreamForm /> */}
        <StreamList className="mt-8" />
      </div>
    </>
  );
}
