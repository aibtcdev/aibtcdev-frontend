
import React from "react";
import Crews from "@/components/crews/Crews";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crews",
};

const page = () => {
  return <Crews />;
};

export default page;
