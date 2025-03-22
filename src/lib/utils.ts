import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getFetchOptions, setFetchOptions } from "@stacks/common";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type StacksRequestInit = RequestInit & {
  referrerPolicy?: string;
};
const fetchOptions: StacksRequestInit = getFetchOptions();
delete fetchOptions.referrerPolicy;
setFetchOptions(fetchOptions);
