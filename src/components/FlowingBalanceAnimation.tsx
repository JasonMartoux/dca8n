"use client";

import { memo } from "react";
import { toEther } from "thirdweb";

interface FlowingBalanceAnimationProps {
  balance: bigint;
  className?: string;
  decimalPlaces?: number;
  format?: (value: number) => string;
}

export const FlowingBalanceAnimation = memo(({ 
  balance,
  className = "",
  decimalPlaces,
  format 
}: FlowingBalanceAnimationProps) => {
  const formattedBalance = toEther(balance);

  return (
    <div className={`font-mono text-lg ${className} transition-all duration-500`}>
      {format
        ? format(parseFloat(formattedBalance))
        : decimalPlaces !== undefined
        ? toFixedUsingString(formattedBalance, decimalPlaces)
        : formattedBalance}
    </div>
  );
});

FlowingBalanceAnimation.displayName = "FlowingBalanceAnimation";

export function toFixedUsingString(
  numStr: string,
  decimalPlaces: number
): string {
  const [wholePart, decimalPart] = numStr.split(".");

  if (!decimalPart || decimalPart.length <= decimalPlaces) {
    return numStr.padEnd(wholePart.length + 1 + decimalPlaces, "0");
  }

  const rounded = `${decimalPart.slice(0, decimalPlaces)}${
    decimalPart[decimalPlaces] >= "5" ? "1" : "0"
  }`;
  return `${wholePart}.${rounded.padStart(decimalPlaces, "0")}`;
}
