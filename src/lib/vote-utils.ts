export async function getProposalVotes(
    contractAddress: string,
    proposalId: number,
): Promise<{
    success: boolean
    votesFor: string
    votesAgainst: string
    formattedVotesFor: string
    formattedVotesAgainst: string
    error?: string
}> {
    const apiBase = 'https://cc702593.aibtcdev-frontend-staging.pages.dev';
    try {
        const response = await fetch(
            `${apiBase}/votes?contractAddress=${encodeURIComponent(contractAddress)}&proposalId=${proposalId}&votesOnly=true`,
        )

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || "Failed to fetch proposal votes")
        }

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.message || "Failed to get votes data")
        }

        // Format the votes for display (assuming they're in raw form and need formatting)
        const votesForNum = Number(data.votesFor) / 1e8
        const votesAgainstNum = Number(data.votesAgainst) / 1e8

        const formatVote = (vote: number): string => {
            if (vote === 0) return "0"
            if (vote < 1) return vote.toFixed(2)
            if (vote < 10) return vote.toFixed(1)
            if (vote < 1000) return Math.round(vote).toString()
            if (vote < 1000000) return (vote / 1000).toFixed(1) + "K"
            return (vote / 1000000).toFixed(1) + "M"
        }

        return {
            success: true,
            votesFor: data.votesFor,
            votesAgainst: data.votesAgainst,
            formattedVotesFor: formatVote(votesForNum),
            formattedVotesAgainst: formatVote(votesAgainstNum),
        }
    } catch (error) {
        console.error("Error in getProposalVotes:", error)
        return {
            success: false,
            votesFor: "0",
            votesAgainst: "0",
            formattedVotesFor: "0",
            formattedVotesAgainst: "0",
            error: error instanceof Error ? error.message : "An unknown error occurred",
        }
    }
}

