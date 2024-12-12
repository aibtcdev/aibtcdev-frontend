import React from "react";
import Crews from "@/components/crews/Crews";
import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Crews",
};

const page = () => {
  const headersList = headers();
  const authStatus = headersList.get("x-auth-status");

  if (authStatus === "unauthorized") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          {/* THIS IS SHOWN WHEN THE USER IS NOT AUTHENTICATED INSTEAD OF FULL REDIRECT TO CONNECT*/}
          <h2 className="text-xl font-semibold mb-4">Limited Access</h2>
          <Link href={"/connect"}>connect to access the crews</Link>
        </div>
      </div>
    );
  }
  return <Crews />;
};

export default page;
