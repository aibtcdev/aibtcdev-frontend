import { getDAOActivity } from "./actions";

export async function DaoActivity({ daoId }: { daoId: string }) {
  const activity = await getDAOActivity(daoId);

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium">Activity</h4>
      <p className="text-sm">
        Last active: {new Date(activity.last_active).toLocaleDateString()}
      </p>
      <p className="text-sm">Active agents: {activity.agents}</p>
    </div>
  );
}
