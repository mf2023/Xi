import * as React from "react";
import { cn } from "@/lib/utils";

export interface BreadcrumbProps {
    path: string;
    onNavigate?: (segment: string, index: number) => void;
    className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, onNavigate, className }) => {
    const segments = path.split("/").filter(Boolean);

    const handleClick = (segment: string, index: number) => {
        onNavigate?.(segment, index);
    };

    return (
        <nav className={cn("breadcrumb flex items-center gap-1", className)}>
            {segments.map((segment, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <span className="breadcrumb__separator">/</span>}
                    <button
                        className="breadcrumb__item"
                        onClick={() => handleClick(segment, index)}
                    >
                        {segment}
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
};

Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };