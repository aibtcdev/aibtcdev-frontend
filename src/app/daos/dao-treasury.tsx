import { getDAOTreasury } from "./actions";

export async function DaoTreasury({ daoId }: { daoId: string }) {
  const treasury = await getDAOTreasury(daoId);

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium">Treasury</h4>
      <p className="text-2xl font-bold">{treasury.stx} STX</p>
      {treasury.tokens.map((token: { ticker: string; amount: number }) => (
        <p key={token.ticker} className="text-sm text-muted-foreground">
          {token.amount} {token.ticker}
        </p>
      ))}
    </div>
  );
}
