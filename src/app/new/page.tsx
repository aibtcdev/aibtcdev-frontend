import { ConnectWallet } from "@/components/new/ConnectWallet";
import { CrewManagement } from "@/components/new/CrewManagement";
import React from "react";

const page = () => {
  return (
    <div>
      <ConnectWallet />
      <CrewManagement />
    </div>
  );
};

export default page;
