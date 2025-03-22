import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getFetchOptions } from "@stacks/network-v6"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const opts = getFetchOptions()
delete opts.referrerPolicy