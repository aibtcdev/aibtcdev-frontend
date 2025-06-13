import React from "react";
import { supabase } from "@/utils/supabase/client";
import { disconnect } from "@stacks/connect";

const SignOut = () => {
  function disconnectWallet() {
    disconnect();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    disconnectWallet();
  }

  return (
    <div>
      <a onClick={handleLogout}>Sign Out</a>
    </div>
  );
};

export default SignOut;
