"use server";

import { dao } from "@aibtcdev/tools";
import type { DAOBasicInfo } from "@aibtcdev/tools";

const sdk = new dao.DaoSDK({
  baseUrl: "/api",
  stacksApi: "https://api.testnet.hiro.so",
  network: "testnet",
});

export async function getDAOsList(): Promise<DAOBasicInfo[]> {
  try {
    const executorIds = await sdk.executor.findAll();
    console.log("Found executors:", executorIds);

    return executorIds.map((id) => ({
      id,
      name: `${id.split(".")[1]}`,
      // status: "active" as const,
      // type: "trading" as const,
      // is_public: true,
      // created_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error in getDAOsList:", error);
    return [];
  }
}

export async function getDAOTreasury(daoId: string) {
  console.log("Getting treasury for DAO:", daoId);
  try {
    return {
      stx: 0,
      tokens: [],
    };
  } catch (error) {
    console.error("Error in getDAOTreasury:", error);
    return { stx: 0, tokens: [] };
  }
}

export async function getDAOActivity(daoId: string) {
  console.log("Getting activity for DAO:", daoId);
  try {
    return {
      last_active: new Date().toISOString(),
      agents: 0,
    };
  } catch (error) {
    console.error("Error in getDAOActivity:", error);
    return {
      last_active: new Date().toISOString(),
      agents: 0,
    };
  }
}
