"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/reusables/Loader";
import { useAdminPanel } from "@/hooks/useAdminPanel";
import { useAdminFilters } from "@/hooks/useAdminFilters";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminTable } from "@/components/admin/AdminTable";

export default function AdminPanel() {
  const {
    profiles,
    loading,
    error,
    isAdmin,
    editingProfile,
    updateProfile,
    handleInputChange,
  } = useAdminPanel();

  const {
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    sortOrder,
    toggleSort,
    filteredProfiles,
    sortedAndFilteredProfiles,
  } = useAdminFilters(profiles);

  if (loading) {
    return <Loader />;
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-4xl mx-auto my-8">
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Access denied. Only administrators can manage profiles.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto my-8">
      <AdminHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        filteredResultsCount={filteredProfiles.length}
        showResultCount={searchTerm !== "" || roleFilter !== "All"}
      />
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AdminTable
          profiles={sortedAndFilteredProfiles}
          editingProfile={editingProfile}
          sortOrder={sortOrder}
          onToggleSort={toggleSort}
          onInputChange={handleInputChange}
          onUpdate={updateProfile}
        />
      </CardContent>
    </Card>
  );
}
