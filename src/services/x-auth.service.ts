/**
 * X (formerly Twitter) OAuth Authentication Service
 *
 * This service handles X account linking using Supabase's identity linking feature.
 * It allows users to link their existing account with their X profile.
 */

import { supabase } from "@/utils/supabase/client";
import type { Provider } from "@supabase/supabase-js";

export interface XProfile {
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
}

export interface XLinkResult {
  success: boolean;
  profile?: XProfile;
  error?: string;
}

/**
 * Link X account to existing user profile using Supabase identity linking
 * This follows the Supabase identity linking guide for OAuth providers
 */
export async function linkXAccount(): Promise<XLinkResult> {
  try {
    // Get current user to ensure they're authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "User must be authenticated before linking X account",
      };
    }

    // Use Supabase's linkIdentity method to link X OAuth
    const { error } = await supabase.auth.linkIdentity({
      provider: "twitter" as Provider,
      options: {
        // Redirect back to the current page after linking
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        scopes: "read:user",
      },
    });

    if (error) {
      console.error("X linking error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // The actual profile update will happen in the auth callback
    // after X OAuth completes
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error linking X account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Unlink X account from user profile
 */
export async function unlinkXAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "User must be authenticated",
      };
    }

    // Find and unlink X identity
    const xIdentity = user.identities?.find(
      (identity) => identity.provider === "twitter"
    );

    if (!xIdentity) {
      return {
        success: false,
        error: "No X account linked",
      };
    }

    // Unlink the X identity
    const { error: unlinkError } =
      await supabase.auth.unlinkIdentity(xIdentity);

    if (unlinkError) {
      console.error("Error unlinking X account:", unlinkError);
      return {
        success: false,
        error: unlinkError.message,
      };
    }

    // Clear username from profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: null })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error clearing username from profile:", updateError);
      // Don't fail the unlink operation if profile update fails
    }

    return { success: true };
  } catch (error) {
    console.error("Error unlinking X account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get linked X profile information
 */
export async function getLinkedXProfile(): Promise<XProfile | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Find X identity
    const xIdentity = user.identities?.find(
      (identity) => identity.provider === "twitter"
    );
    if (!xIdentity?.identity_data) {
      return null;
    }

    // Extract X profile data from identity
    const identityData = xIdentity.identity_data;

    return {
      id: identityData.sub || identityData.id,
      username:
        identityData.username ||
        identityData.user_name ||
        identityData.screen_name ||
        identityData.preferred_username,
      name:
        identityData.name ||
        identityData.full_name ||
        identityData.display_name,
      profile_image_url:
        identityData.profile_image_url ||
        identityData.avatar_url ||
        identityData.picture,
    };
  } catch (error) {
    console.error("Error getting X profile:", error);
    return null;
  }
}

/**
 * Check if user has a X account linked
 */
export async function hasLinkedXAccount(): Promise<boolean> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    return (
      user.identities?.some((identity) => identity.provider === "twitter") ??
      false
    );
  } catch (error) {
    console.error("Error checking X link status:", error);
    return false;
  }
}

/**
 * Update profile username after successful X linking
 * This should be called from the auth callback after X OAuth completes
 */
export async function updateProfileWithXUsername(): Promise<{
  success: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const xProfile = await getLinkedXProfile();

    if (!xProfile) {
      return {
        success: false,
        error: "No X profile found",
      };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Update the profile with X username only
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: xProfile.username,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile with X username:", updateError);
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      username: xProfile.username,
    };
  } catch (error) {
    console.error("Error updating profile with X username:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Extract X username from X URL
 * Supports both x.com and twitter.com formats
 */
export function extractXUsernameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Check if it's a valid X/Twitter domain
    if (
      !["x.com", "twitter.com", "www.x.com", "www.twitter.com"].includes(
        urlObj.hostname
      )
    ) {
      return null;
    }

    // Extract username from path like /username/status/123 or just /username
    const pathParts = urlObj.pathname
      .split("/")
      .filter((part) => part.length > 0);

    if (pathParts.length > 0) {
      const username = pathParts[0];
      // Basic validation - username should not be a reserved path
      const reservedPaths = [
        "home",
        "explore",
        "notifications",
        "messages",
        "bookmarks",
        "lists",
        "profile",
        "settings",
        "help",
      ];

      if (
        !reservedPaths.includes(username.toLowerCase()) &&
        username.match(/^[a-zA-Z0-9_]+$/)
      ) {
        return username;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate if X username in URL matches the user's linked X account
 */
export async function validateXUsernameMatch(
  xUrl: string
): Promise<{
  isValid: boolean;
  linkedUsername?: string;
  urlUsername?: string;
  error?: string;
}> {
  try {
    // Extract username from URL
    const urlUsername = extractXUsernameFromUrl(xUrl);

    if (!urlUsername) {
      return {
        isValid: false,
        error: "Invalid X URL format",
      };
    }

    // Get linked X profile
    const xProfile = await getLinkedXProfile();

    if (!xProfile) {
      return {
        isValid: false,
        error: "No X account linked",
      };
    }

    // Compare usernames (case insensitive)
    const isMatch =
      urlUsername.toLowerCase() === xProfile.username.toLowerCase();

    return {
      isValid: isMatch,
      linkedUsername: xProfile.username,
      urlUsername: urlUsername,
      error: isMatch
        ? undefined
        : `X URL username (@${urlUsername}) does not match your linked account (@${xProfile.username})`,
    };
  } catch (error) {
    console.error("Error validating X username match:", error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
