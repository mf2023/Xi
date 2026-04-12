import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps {
    direction?: "horizontal" | "vertical";
    gap?: number;
    flex?: string | number | boolean;
    className?: string;
    children?: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({
    direction = "horizontal",
    gap = 0,
    flex = false,
    className,
    children,
}) => {
    const isHorizontal = direction === "horizontal";

    return (
        <div
            className={cn(
                "flex",
                isHorizontal ? "flex-row" : "flex-col",
                flex && typeof flex === "string" && flex,
                className
            )}
            style={{
                gap: `${gap}px`,
                flex: typeof flex === "number" ? flex : flex === true ? 1 : undefined,
            }}
        >
            {children}
        </div>
    );
};

Container.displayName = "Container";

export { Container };