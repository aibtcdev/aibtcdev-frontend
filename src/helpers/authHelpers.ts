import { AppConfig, UserSession } from "@stacks/auth";
import { StacksMainnet } from "@stacks/network";
import { showConnect, openSignatureRequestPopup } from "@stacks/connect";
import { verifyMessageSignatureRsv } from "@stacks/encryption";

// Configuration constants for authentication
const FRONTEND_SECRET_KEY = "c4cf807d-acb2-497c-84e8-3098957b5339";
const API_BASE_URL = "https://services.aibtc.dev/auth";

// Create an app configuration with required permissions
export const appConfig = new AppConfig(["store_write", "publish_data"]);

// Initialize a user session with the app configuration
export const userSession = new UserSession({ appConfig });


export interface AuthResult {
    stxAddress: string;
    sessionToken: string;
}


export const checkSessionToken = async (): Promise<AuthResult | null> => {
    // Retrieve stored session token and STX address from local storage
    const storedSessionToken = localStorage.getItem("sessionToken");
    const storedStxAddress = localStorage.getItem("stxAddress");

    // If both token and address exist, attempt to verify
    if (storedSessionToken && storedStxAddress) {
        try {
            // Send a request to backend to verify the session token
            const response = await fetch(`${API_BASE_URL}/verify-session-token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: FRONTEND_SECRET_KEY,
                },
                body: JSON.stringify({ data: storedSessionToken }),
            });

            // If verification is successful, return the authentication result
            if (response.ok) {
                return {
                    stxAddress: storedStxAddress,
                    sessionToken: storedSessionToken
                };
            }
        } catch (error) {
            console.error("Error verifying session token:", error);
        }
    }
    return null;
};


export const initiateAuthentication = (onSuccess: (address: string) => void) => {
    showConnect({

        appDetails: {
            name: "sprint.aibtc.dev",
            icon: window.location.origin + "/app-icon.png",
        },
        redirectTo: "/",
        onFinish: () => {
            const userData = userSession.loadUserData();
            onSuccess(userData.profile.stxAddress.mainnet);
        },
        userSession: userSession,
    });
};

export const promptSignMessage = (
    stxAddress: string,
    onSuccess: (result: AuthResult) => void,
    onError: (error: string) => void
) => {
    // Predefined message to be signed
    const message = "Welcome to aibtcdev!";

    // Open signature request popup using Stacks Connect
    openSignatureRequestPopup({
        message,
        network: new StacksMainnet(),
        appDetails: {
            name: "sprint.aibtc.dev",
            icon: window.location.origin + "/app-icon.png",
        },
        stxAddress,
        // Callback when signature is completed
        onFinish: (data) => verifyAndSendSignedMessage(
            message,
            data.signature,
            data.publicKey,
            stxAddress,
            onSuccess,
            onError
        ),
        // Callback if user cancels signing
        onCancel: () => {
            onError("Message signing was cancelled.");
        },
    });
};


//  Verifies the signed message and requests an authentication token from the backend
export const verifyAndSendSignedMessage = async (
    message: string,
    signature: string,
    publicKey: string,
    stxAddress: string,
    onSuccess: (result: AuthResult) => void,
    onError: (error: string) => void
) => {
    try {
        // Locally verify the signature to ensure its validity
        const isSignatureValid = verifyMessageSignatureRsv({
            message,
            signature,
            publicKey,
        });

        // If signature is invalid, trigger error callback
        if (!isSignatureValid) {
            onError("Signature verification failed");
            return;
        }

        // Send signature to backend to request authentication token
        const response = await fetch(`${API_BASE_URL}/request-auth-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: FRONTEND_SECRET_KEY,
            },
            body: JSON.stringify({
                data: signature,
            }),
        });

        const data = await response.json();
        // Handle successful authentication
        if (response.ok) {
            // Store authentication details in local storage
            localStorage.setItem("sessionToken", data.sessionToken);
            localStorage.setItem("stxAddress", stxAddress);

            // Prepare authentication result
            const authResult = {
                stxAddress,
                sessionToken: data.sessionToken
            };
            onSuccess(authResult);
        } else {
            console.error("Auth Error:", data);
            onError(data.error || "Authentication failed. Please try again.");
        }
    } catch (error) {
        console.error("Error getting auth token:", error);
        onError("Authentication failed. Please try again.");
    }
};


// Logs out the user by removing authentication tokens from local storage
export const logout = () => {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("stxAddress");
};