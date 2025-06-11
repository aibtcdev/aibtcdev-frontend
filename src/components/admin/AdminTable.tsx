import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Profile, SortOrder, UserRole } from "@/hooks/useAdminPanel";

interface AdminTableProps {
  profiles: Profile[];
  editingProfile: {
    [key: string]: {
      assigned_agent_address: string;
      account_index: string;
      role: UserRole;
    };
  };
  sortOrder: SortOrder;
  onToggleSort: () => void;
  onInputChange: (
    userId: string,
    field: "assigned_agent_address" | "account_index" | "role",
    value: string
  ) => void;
  onUpdate: (userId: string) => Promise<void>;
}

export function AdminTable({
  profiles,
  editingProfile,
  sortOrder,
  onToggleSort,
  onInputChange,
  onUpdate,
}: AdminTableProps) {
  const getSortIcon = () => {
    if (sortOrder === "asc")
      return <ArrowUp className="inline-block ml-1 h-4 w-4" />;
    if (sortOrder === "desc")
      return <ArrowDown className="inline-block ml-1 h-4 w-4" />;
    return <ArrowUpDown className="inline-block ml-1 h-4 w-4" />;
  };

  const getSortText = () => {
    if (sortOrder === "asc") return "Ascending";
    if (sortOrder === "desc") return "Descending";
    return "Default";
  };

  const formatEmail = (email: string): string => {
    return email.split("@")[0].toUpperCase();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th
              className="px-4 py-2 text-left cursor-pointer"
              onClick={onToggleSort}
            >
              Account Index {getSortIcon()}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({getSortText()})
              </span>
            </th>
            <th className="px-4 py-2 text-left">Stacks Addresses</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Agent Address</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-b">
              <td className="px-4 py-2">
                <Input
                  type="text"
                  value={editingProfile[profile.id]?.account_index || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      onInputChange(profile.id, "account_index", value);
                    }
                  }}
                  placeholder="Enter account index"
                  className="w-full"
                />
              </td>
              <td className="px-4 py-2 font-mono">
                {formatEmail(profile.email)}
              </td>
              <td className="px-4 py-2">
                <select
                  className="w-full p-2 border rounded-md"
                  value={editingProfile[profile.id]?.role || profile.role}
                  onChange={(e) =>
                    onInputChange(
                      profile.id,
                      "role",
                      e.target.value as UserRole
                    )
                  }
                >
                  <option value="No Role">No Role</option>
                  <option value="Normal">Normal</option>
                  <option value="Admin">Admin</option>
                  <option value="Participant">Participant</option>
                </select>
              </td>
              <td className="px-4 py-2">
                <Input
                  type="text"
                  value={
                    editingProfile[profile.id]?.assigned_agent_address || ""
                  }
                  onChange={(e) =>
                    onInputChange(
                      profile.id,
                      "assigned_agent_address",
                      e.target.value
                    )
                  }
                  placeholder="Enter agent address"
                  className="w-full"
                />
              </td>
              <td className="px-4 py-2">
                <Button onClick={() => onUpdate(profile.id)}>Update</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 text-sm text-muted-foreground text-center">
        Total participants: {profiles.length}
      </div>
    </div>
  );
}
