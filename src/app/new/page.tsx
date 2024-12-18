import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div>
      Available routes:
      <Link href={"/new/crews"}>New Crew Management</Link>
    </div>
  );
};

export default page;
