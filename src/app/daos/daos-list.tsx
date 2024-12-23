import DaosTable from "./daos-table";
import { getDAOsList } from "./actions";

export default async function DaoList() {
  const daos = await getDAOsList();

  return (
    <div className="mt-6">
      <DaosTable daos={daos} />
    </div>
  );
}
