import React from "react";
import { ConnectWallet } from "@/components/new/ConnectWallet";
import { CrewManagement } from "@/components/new/CrewManagement";

const page = () => {
  return (
    <div>
      <ConnectWallet />
      <CrewManagement />
    </div>
  );
};

export default page;
