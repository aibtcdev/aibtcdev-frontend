// import { Cl, fetchCallReadOnlyFunction } from "@stacks/transactions";
// import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";
import { NextResponse } from "next/server";

export const runtime = "edge"
// export const dynamic = 'force-dynamic'
// Define network based on environment variable
// const network = "testnet"
//const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
//    ? STACKS_TESTNET
//    : STACKS_MAINNET;

export async function GET(request: Request) {
    console.log("request object", request)
    // return mock data as a test
    return NextResponse.json({
        success: true,
        votesFor: 1000000,
        votesAgainst: 1000000,
    })

    /*
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get("contractAddress");
    const proposalId = searchParams.get("proposalId");
    //const votesOnly = searchParams.get("votesOnly") === "true";

    if (!contractAddress || !proposalId) {
        return NextResponse.json(
            {
                success: false,
                message: "Missing required parameters: contractAddress or proposalId",
            },
            { status: 400 }
        );
    }

    try {
        // Split the contract address into address and name parts
        const [address, contractName] = contractAddress.split(".");

        if (!address || !contractName) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid contract address format. Expected format: address.contractName",
                    data: null,
                },
                { status: 400 }
            );
        }

        // DOES IT AFFECT ANYTHING IF I PASS RANDOM ADDRESS ?
        const senderAddress = "ST000000000000000000002AMW42H";

        // Fetch data
        const result = await fetchCallReadOnlyFunction({
            contractAddress: address,
            contractName: contractName,
            functionName: "get-proposal",
            functionArgs: [Cl.uint(Number.parseInt(proposalId))],
            senderAddress,
            network,
        });

        return NextResponse.json({
            success: true,
            message: String(result),
        });

        /*

        const jsonResult = cvToJSON(result);

        // If votesOnly is true, extract just the votes data
        if (votesOnly) {
            try {
                // Navigate through the nested structure to get votes data
                const proposalData = jsonResult.value?.value;

                if (proposalData) {
                    return NextResponse.json({
                        success: true,
                        votesFor: proposalData.votesFor?.value,
                        votesAgainst: proposalData.votesAgainst?.value,
                    });
                }
            } catch (error) {
                console.error("Error extracting votes data:", error);
            }
        }

        // Return the full result if not votesOnly or if extraction failed
        return NextResponse.json({
            success: true,
            message: "Proposal retrieved successfully",
            data: jsonResult,
            proposalId: proposalId,
            contractAddress: contractAddress,
        });
        
    } catch (error) {
        console.error("Error in getProposal:", error);
        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "An unknown error occurred",
                error: String(error),
            },
            { status: 500 }
        );
    }
        */
}
