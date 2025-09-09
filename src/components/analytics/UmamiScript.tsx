import Script from "next/script";

export function UmamiScript() {
  // Determine the correct website ID based on STACKS_NETWORK environment
  const getWebsiteId = () => {
    const stacksNetwork = process.env.NEXT_PUBLIC_STACKS_NETWORK;

    // Production environment (mainnet)
    if (stacksNetwork === "mainnet") {
      return "ba31a12a-0e66-4813-be9f-b68e34d35c8f"; // aibtc.com
    }

    // Staging/Development environment (testnet)
    return "fb6c4cae-0bef-4418-aeda-ac885f7361b9"; // staging.aibtc.dev
  };

  const websiteId = getWebsiteId();

  return (
    <Script
      src="https://cloud.umami.is/script.js"
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
