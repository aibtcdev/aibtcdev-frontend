"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/catalyst/badge";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  assigned_agent_address: string | null;
  role: string;
  discord_username: string | null;
}

interface TelegramUser {
  id: string | null;
  telegram_user_id: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  is_registered: boolean;
  profile_id: string | null;
}

const formatEmail = (email: string): string => {
  return email.split("@")[0].toUpperCase();
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: telegramData, error: telegramError } = await supabase
          .from("telegram_users")
          .select("*")
          .eq("profile_id", user.id)
          .single();

        if (!telegramError) {
          setTelegramUser(telegramData);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const initializeTelegramUser = async () => {
    try {
      setTelegramLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error: upsertError } = await supabase
        .from("telegram_users")
        .upsert({
          profile_id: user.id,
          is_registered: false,
        });

      if (upsertError) throw upsertError;

      // Reload telegram user data
      const { data: telegramData } = await supabase
        .from("telegram_users")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      setTelegramUser(telegramData);
    } catch (error) {
      console.error("Error initializing telegram user:", error);
    } finally {
      setTelegramLoading(false);
    }
  };

  const startTelegramBot = async () => {
    window.open(`https://t.me/aitbtcdevbot?start=${telegramUser?.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
            <CardDescription>
              Your blockchain wallet and agent details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Profile ID</label>
              <div className="font-mono bg-background p-2 rounded-md">
                {profile?.id || "No wallet connected"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">STX Address</label>
              <div className="font-mono bg-background p-2 rounded-md">
                {profile?.email && formatEmail(profile?.email)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Agent Address</label>
              <div className="font-mono bg-background p-2 rounded-md">
                {profile?.assigned_agent_address || "No agent assigned"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <div>
                <Badge color="blue">{profile?.role || "Normal User"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Connections</CardTitle>
            <CardDescription>Your connected social accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Discord</label>
              <div className="bg-background p-2 rounded-md space-y-2">
                <Badge color={profile?.discord_username ? "green" : "red"}>
                  {profile?.discord_username ? "Connected" : "Not Connected"}
                </Badge>
                {profile?.discord_username && <p> {profile.discord_username}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Telegram</label>
              {telegramUser ? (
                <div className="bg-background p-2 rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      color={telegramUser.is_registered ? "green" : "yellow"}
                    >
                      {telegramUser.is_registered ? "Connected" : "Pending Registration"}
                    </Badge>
                  </div>
                  {telegramUser.is_registered && (
                    <>
                      <p>{telegramUser.username || "N/A"}</p>
                    </>
                  )}
                  {!telegramUser.is_registered && (
                    <Button onClick={startTelegramBot}>Start</Button>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  <Button
                    onClick={initializeTelegramUser}
                    disabled={telegramLoading}
                  >
                    {telegramLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Initialize Telegram Connection
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
