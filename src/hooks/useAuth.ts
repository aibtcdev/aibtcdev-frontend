import { useState } from 'react';
import { AppConfig, showConnect, UserSession } from "@stacks/connect";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAuthentication = async (stxAddress: string) => {
        try {
            // Try to sign in first
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: `${stxAddress}@stacks.id`,
                password: stxAddress,
            });

            if (signInError && signInError.status === 400) {
                // User doesn't exist, proceed with sign up
                toast({
                    description: "Creating your account...",
                });

                const { error: signUpError } = await supabase.auth.signUp({
                    email: `${stxAddress}@stacks.id`,
                    password: stxAddress,
                });

                if (signUpError) throw signUpError;

                toast({
                    description: "Successfully signed up...",
                    variant: "default",
                });

                return true;
            } else if (signInError) {
                throw signInError;
            }

            toast({
                description: "Redirecting...",
                variant: "default",
            });

            return true;
        } catch (error) {
            console.error("Authentication error:", error);
            toast({
                description: "Authentication failed. Please try again.",
                variant: "destructive",
            });
            return false;
        }
    };

    const connectWallet = async () => {
        setIsLoading(true);
        try {
            toast({
                description: "Connecting wallet...",
            });

            // Connect wallet
            await new Promise<void>((resolve) => {
                showConnect({
                    appDetails: {
                        name: "AIBTC Champions Sprint",
                        icon: window.location.origin + "/logos/aibtcdev-avatar-1000px.png",
                    },
                    onCancel: () => {
                        toast({
                            description: "Wallet connection cancelled.",
                        });
                        setIsLoading(false);
                    },
                    onFinish: () => resolve(),
                    userSession,
                });
            });

            const userData = userSession.loadUserData();
            const stxAddress = userData.profile.stxAddress.mainnet;

            toast({
                description: "Wallet connected. Authenticating...",
            });

            return { stxAddress, success: await handleAuthentication(stxAddress) };
        } catch (error) {
            console.error("Wallet connection error:", error);
            toast({
                description: "Failed to connect wallet. Please try again.",
                variant: "destructive",
            });
            return { stxAddress: null, success: false };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        connectWallet,
        isLoading,
    };
};