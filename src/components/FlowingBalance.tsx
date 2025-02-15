import { useState, useEffect, memo, useMemo } from "react";
import { formatUnits } from "ethers";
import { toEther } from "thirdweb";

interface FlowingBalanceProps {
  startingBalance: bigint;
  startingBalanceDate: Date;
  flowRate: bigint;
  className?: string;
  tokenDecimals?: number;
  format?: (value: number) => string;
}

const ANIMATION_MINIMUM_STEP_TIME = 40; // Minimum time between updates in ms

// Utility functions
export const absoluteValue = (n: bigint) => (n >= BigInt(0) ? n : -n);

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

const useFlowingBalance = (
  startingBalance: bigint,
  startingBalanceDate: Date,
  flowRate: bigint
) => {
  const [flowingBalance, setFlowingBalance] = useState(startingBalance);
  const startingBalanceTime = startingBalanceDate.getTime();

  useEffect(() => {
    if (flowRate === BigInt(0)) return;

    let lastAnimationTimestamp = 0;
    let animationFrameId: number;

    const animationStep = (currentAnimationTimestamp: number) => {
      animationFrameId = window.requestAnimationFrame(animationStep);

      if (
        currentAnimationTimestamp - lastAnimationTimestamp >
        ANIMATION_MINIMUM_STEP_TIME
      ) {
        const elapsedTimeInMilliseconds = BigInt(
          Date.now() - startingBalanceTime
        );
        const flowingBalance_ =
          startingBalance +
          (flowRate * elapsedTimeInMilliseconds) / BigInt(1000);

        setFlowingBalance(flowingBalance_);
        lastAnimationTimestamp = currentAnimationTimestamp;
      }
    };

    animationFrameId = window.requestAnimationFrame(animationStep);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [startingBalance, startingBalanceTime, flowRate]);

  return flowingBalance;
};

// Decimal calculation hook
const useSignificantFlowingDecimal = (flowRate: bigint) => {
  return useMemo(() => {
    if (flowRate === BigInt(0)) return undefined;

    const ticksPerSecond = 1000 / ANIMATION_MINIMUM_STEP_TIME;
    const flowRatePerTick = flowRate / BigInt(ticksPerSecond);
    const [beforeDecimal] = toEther(flowRatePerTick).split(".");

    return absoluteValue(BigInt(beforeDecimal)) > BigInt(0)
      ? 0
      : Math.min(
          flowRatePerTick.toString().length -
            flowRatePerTick.toString().search(/[1-9]/),
          18
        );
  }, [flowRate]);
};

const FlowingBalanceComponent = memo(
  ({
    startingBalance,
    startingBalanceDate,
    flowRate,
    className = "",
    format,
  }: FlowingBalanceProps) => {
    const balance = useFlowingBalance(
      startingBalance,
      startingBalanceDate,
      flowRate
    );

    const decimalPlaces = useSignificantFlowingDecimal(flowRate);
    const formattedBalance = toEther(balance);

    return (
      <div className={`flowing-balance ${className}`}>
        {format
          ? format(parseFloat(formattedBalance))
          : decimalPlaces !== undefined
          ? toFixedUsingString(formattedBalance, decimalPlaces)
          : formattedBalance}
      </div>
    );
  }
);

FlowingBalanceComponent.displayName = "FlowingBalance";

export default FlowingBalanceComponent;
