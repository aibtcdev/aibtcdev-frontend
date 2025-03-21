import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getFetchOptions, setFetchOptions } from "@stacks/common";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// workaround for using stacks.js fetch in Cloudflare Workers
type StacksRequestInit = RequestInit & {
  referrerPolicy?: string;
};
const fetchOptions: StacksRequestInit = getFetchOptions();
delete fetchOptions.referrerPolicy;
setFetchOptions(fetchOptions);
