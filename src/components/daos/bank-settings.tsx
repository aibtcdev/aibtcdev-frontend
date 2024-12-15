"use client";
// app/daos/[id]/manage/components/bank-settings.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BankSettings() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Add save logic here
    setTimeout(() => setIsLoading(false), 1000); // Simulate API call
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Bank Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Withdrawal Period (blocks)
              </label>
              <input
                type="number"
                defaultValue={144}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Withdrawal Amount (STX)
              </label>
              <input
                type="number"
                defaultValue={10}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
