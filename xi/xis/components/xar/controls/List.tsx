import * as React from "react";
import { cn } from "@/lib/utils";

export interface ListProps<T> {
    data: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
}

function List<T>({ data, renderItem, className }: ListProps<T>) {
    return (
        <div className={cn("list-component", className)}>
            {data.map((item, index) => renderItem(item, index))}
        </div>
    );
}

List.displayName = "List";

export { List };