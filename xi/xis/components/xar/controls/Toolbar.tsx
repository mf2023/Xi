import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToolbarProps {
    children?: React.ReactNode;
    className?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ children, className }) => {
    return (
        <div className={cn("toolbar flex items-center gap-2 p-2", className)}>
            {children}
        </div>
    );
};

Toolbar.displayName = "Toolbar";

export { Toolbar };