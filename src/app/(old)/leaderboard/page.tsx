"use client";

import React, { useState, useMemo } from "react";
import { Search, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUserData } from "@/hooks/useUserData";
import { useLeaderboardData } from "@/hooks/useLeaderBoardData";
import { ProfileWithBalance } from "@/types/supabase";
import { Loader } from "@/components/reusables/Loader";

function PortfolioValueCell({
  value,
  isLoading,
}: {
  value: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Loader />;
  }
  return <span className="font-bold">${value.toFixed(4)}</span>;
}

export default function LeaderBoard() {
  const {
    data: leaderboard,
    isLoading,
    totalAgentBalance,
    error,
  } = useLeaderboardData();
  const { data: userData } = useUserData();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredLeaderboard = useMemo(() => {
    return (leaderboard ?? []).filter((profile) => {
      const stacksAddress = profile.email.split("@")[0].toLowerCase();
      return stacksAddress.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, leaderboard]);

  const authenticatedUserProfile = useMemo(() => {
    if (!leaderboard || !userData) return null;
    return leaderboard.find(
      (profile) =>
        profile.email.split("@")[0].toLowerCase() ===
        userData.stxAddress.toLowerCase()
    );
  }, [leaderboard, userData]);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <CardTitle className="text-2xl font-bold">
          Participant Leaderboard
        </CardTitle>
        <div className="text-sm text-muted-foreground mt-2">
          Total Agent Balance: ${totalAgentBalance.toFixed(2)}
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search Participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {authenticatedUserProfile && (
          <Card className="mb-6 bg-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="font-bold">Your Position</span>
                </div>
                <Badge variant="secondary">
                  Rank: {authenticatedUserProfile.rank}
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Agent Address</TableHead>
                    <TableHead className="text-right">
                      Portfolio Value
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono">
                      {authenticatedUserProfile.email
                        .split("@")[0]
                        .toUpperCase()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {authenticatedUserProfile.assigned_agent_address || (
                        <Badge variant="outline">No agent assigned</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <PortfolioValueCell
                        value={authenticatedUserProfile.portfolioValue}
                        isLoading={authenticatedUserProfile.isLoadingBalance}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Agent Address</TableHead>
              <TableHead className="text-right">Portfolio Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeaderboard.map((profile: ProfileWithBalance) => (
              <TableRow
                key={profile.email}
                className={
                  profile.email === authenticatedUserProfile?.email
                    ? "bg-primary/10"
                    : undefined
                }
              >
                <TableCell>
                  <span className="font-medium">{profile.rank}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono">
                    {profile.email.split("@")[0].toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {profile.assigned_agent_address || (
                    <Badge variant="outline">No agent assigned</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <PortfolioValueCell
                    value={profile.portfolioValue}
                    isLoading={profile.isLoadingBalance}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-6 text-sm text-muted-foreground text-center">
          Total participants: {filteredLeaderboard.length}
        </div>
      </CardContent>
    </Card>
  );
}
