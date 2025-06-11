import { Search } from "lucide-react";
import Link from "next/link";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/hooks/useAdminPanel";

interface AdminHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: UserRole | "All";
  onRoleFilterChange: (value: UserRole | "All") => void;
  filteredResultsCount: number;
  showResultCount: boolean;
}

export function AdminHeader({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  filteredResultsCount,
  showResultCount,
}: AdminHeaderProps) {
  return (
    <CardHeader>
      <CardTitle>Admin Panel</CardTitle>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search Stacks address..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <Link href="/admin/metrics">
            <Button>See metrics</Button>
          </Link>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Roles</SelectItem>
            <SelectItem value="No Role">No Role</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Participant">Participant</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {showResultCount && (
        <div className="mt-2 text-sm text-gray-500">
          Found: {filteredResultsCount} results
        </div>
      )}
    </CardHeader>
  );
}
