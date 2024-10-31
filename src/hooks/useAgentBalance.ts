import { useQuery } from '@tanstack/react-query'

async function fetchAgentBalance(agentAddress: string | null): Promise<number | null> {
  if (!agentAddress) return null

  const response = await fetch(`https://api.hiro.so/extended/v1/address/${agentAddress.toUpperCase()}/balances`)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const data = await response.json()
  return data.stx?.balance ? parseInt(data.stx.balance) / 1000000 : null
}

export function useAgentBalance(agentAddress: string | null) {
  return useQuery<number | null, Error>({
    queryKey: ['agentBalance', agentAddress],
    queryFn: () => fetchAgentBalance(agentAddress),
    enabled: !!agentAddress,
  })
}