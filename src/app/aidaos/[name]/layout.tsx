import type { Metadata } from "next";
// import { supabase } from "@/utils/supabase/client";
import { fetchDAOByName } from "@/services/dao.service";
import { extractMission } from "@/utils/format";
import { DAOLayoutClient } from "./layout-client";

// Twitter recommends 2:1 ratio images
// Minimum dimensions: 300x157
// Maximum dimensions: 4096x4096
// Recommended dimensions: 1200x600
// const TWITTER_IMAGE_WIDTH = 1200;
// const TWITTER_IMAGE_HEIGHT = 600;

// Open Graph recommends 1.91:1 ratio
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 628;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dao = await fetchDAOByName(resolvedParams.name);

  if (!dao) {
    return {
      title: "Not Found",
      description: "The requested item could not be found.",
    };
  }

  // Now fetch the token using the ID
  // const { data: token } = await supabase
  //   .from("tokens")
  //   .select("image_url")
  //   .eq("dao_id", dao.id)
  //   .single();

  // Generate separate URLs for Twitter and Open Graph with correct dimensions
  const twitterImageUrl = "https://aibtc.com/logos/twitter-share-image.jpeg";

  const ogImageUrl = "https://aibtc.com/logos/twitter-share-image.jpeg";

  // Extract SEO-friendly shorter description using extractMission
  const seoDescription = extractMission(dao.description);

  return {
    // title: dao.name,
    title: "AIBTC",
    description: seoDescription,
    openGraph: {
      title: "AIBTC",
      description: seoDescription,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: OG_IMAGE_WIDTH,
              height: OG_IMAGE_HEIGHT,
              alt: `${dao.name} token logo`,
            },
          ]
        : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "AIBTC",
      description: seoDescription,
      // Twitter specific image with 2:1 ratio
      images: twitterImageUrl ? [twitterImageUrl] : undefined,
      creator: "@aibtcdev",
    },
    alternates: {
      canonical: `/aidaos/${resolvedParams.name}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    keywords: [dao.name, "Blockchain", "Governance", "Token"],
  };
}

export default function DAOLayout({ children }: { children: React.ReactNode }) {
  return <DAOLayoutClient>{children}</DAOLayoutClient>;
}
