import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { BsTwitterX } from "react-icons/bs";
import type { DAO, Token } from "@/types/supabase";

interface DAOCardProps {
  dao: DAO;
  token?: Token;
  tokenPrice?: {
    price: number;
    marketCap: number;
    holders: number;
    price24hChanges: number | null;
  };
  isFetchingPrice?: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

export const DAOCard = ({
  dao,
  token,
  tokenPrice,
  isFetchingPrice,
}: DAOCardProps) => {
  return (
    <div className="group h-full">
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg">
              <Image
                src={
                  token?.image_url ||
                  dao.image_url ||
                  "/placeholder.svg?height=64&width=64" ||
                  "/placeholder.svg" ||
                  "/placeholder.svg"
                }
                alt={dao.name}
                width={64}
                height={64}
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                placeholder="blur"
                blurDataURL="/placeholder.svg?height=64&width=64"
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link href={`/daos/${dao.id}`}>
                    <h3 className="text-lg font-semibold leading-none tracking-tight group-hover:text-primary">
                      {dao.name}
                    </h3>
                  </Link>
                  {dao.is_graduated && (
                    <Badge variant="secondary" className="h-5">
                      Graduated
                    </Badge>
                  )}
                </div>
              </div>
              {token?.symbol && (
                <p className="text-sm font-medium text-muted-foreground">
                  ${token.symbol}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <Link href={`/daos/${dao.id}`}>
          <CardContent className="space-y-4">
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {dao.mission}
            </p>

            <Separator className="my-2" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">Token Price</p>
                {isFetchingPrice ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <p className="font-medium">
                    ${tokenPrice?.price?.toFixed(8) || "0.00"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground">24h Change</p>
                {isFetchingPrice ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <div className="flex items-center gap-1 font-medium">
                    {tokenPrice?.price24hChanges != null ? (
                      <>
                        {tokenPrice.price24hChanges > 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : tokenPrice.price24hChanges < 0 ? (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        ) : null}
                        <span
                          className={
                            tokenPrice.price24hChanges > 0
                              ? "text-green-500"
                              : tokenPrice.price24hChanges < 0
                              ? "text-red-500"
                              : ""
                          }
                        >
                          {Math.abs(tokenPrice.price24hChanges).toFixed(2)}%
                        </span>
                      </>
                    ) : (
                      "0.00%"
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Link>

        <CardFooter className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-muted-foreground">Market Cap</p>
            {isFetchingPrice ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <p className="font-medium">
                ${formatNumber(tokenPrice?.marketCap || 0)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">Holders</p>
            {isFetchingPrice ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <p className="font-medium">{tokenPrice?.holders || 0}</p>
            )}
          </div>
        </CardFooter>
        {dao.user_id ? (
          <CardFooter className="mt-2 flex items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
            <span>Prompted by:</span>
            <Link
              href={`https://x.com/i/user/${dao.user_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              View on
              <span>
                <BsTwitterX className="h-4 w-4" />
              </span>
            </Link>
          </CardFooter>
        ) : (
          <CardFooter className="mt-2 flex items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
            <span>Prompted by: X user</span>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
