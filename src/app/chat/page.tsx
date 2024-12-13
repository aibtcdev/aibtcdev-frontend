import React from "react";
import { headers } from "next/headers";
import Chat from "@/components/chat/Chat";
import Link from "next/link";

export const runtime = "edge";

const page = () => {
  const headersList = headers();
  const authStatus = headersList.get("x-auth-status");

  if (authStatus === "unauthorized") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          {/* THIS IS SHOWN WHEN THE USER IS NOT AUTHENTICATED INSTEAD OF FULL REDIRECT TO CONNECT*/}
          <h2 className="text-xl font-semibold mb-4">Limited Access</h2>
          <Link href={"/connect"}>connect to access the chat</Link>
        </div>
      </div>
    );
  }
  // Render chat component if authenticated
  return <Chat />;
};

export default page;
