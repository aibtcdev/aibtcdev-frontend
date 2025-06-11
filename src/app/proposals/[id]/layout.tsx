import React from "react";
import type { Metadata, Viewport } from "next";
import { ProposalDetailsLayoutClient } from "./layout-client";
import { fetchProposalById } from "@/services/dao.service";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const proposal = await fetchProposalById(params.id);

    if (!proposal) {
      return {
        title: "Proposal Not Found",
        description: "The requested proposal could not be found.",
      };
    }

    const daoName = proposal.daos?.name || "Unknown DAO";
    const title = `${proposal.title} - ${daoName}`;
    const description =
      proposal.summary ||
      proposal.content ||
      `View proposal details for ${proposal.title} in ${daoName}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `/proposals/${params.id}`,
      },
      twitter: {
        card: "summary",
        title,
        description,
        creator: "@aibtcdev",
      },
      alternates: {
        canonical: `/proposals/${params.id}`,
      },
      robots: {
        index: true,
        follow: true,
      },
      keywords: [
        proposal.title,
        daoName,
        "Proposal",
        "DAO",
        "Governance",
        "Vote",
        "Blockchain",
      ],
    };
  } catch (error) {
    console.error("Error generating metadata for proposal:", error);
    return {
      title: "Proposal Details",
      description: "View detailed information about a DAO proposal",
    };
  }
}

export default function ProposalDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProposalDetailsLayoutClient>{children}</ProposalDetailsLayoutClient>;
}
