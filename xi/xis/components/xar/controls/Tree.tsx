import * as React from "react";
import { cn } from "@/lib/utils";

export interface TreeNode {
    id: string;
    name: string;
    isDirectory?: boolean;
    children?: TreeNode[];
}

export interface TreeProps {
    data: TreeNode[];
    onSelect?: (node: TreeNode) => void;
    selected?: string | null;
    level?: number;
    className?: string;
}

const Tree: React.FC<TreeProps> = ({
    data,
    onSelect,
    selected,
    level = 0,
    className,
}) => {
    const handleSelect = (node: TreeNode) => {
        onSelect?.(node);
    };

    return (
        <div className={cn("tree-component", className)} style={{ paddingLeft: level * 16 }}>
            {data.map((node) => (
                <div key={node.id}>
                    <div
                        className={cn(
                            "tree-node",
                            selected === node.id && "tree-node--selected"
                        )}
                        onClick={() => handleSelect(node)}
                    >
                        <span className="tree-node__icon">
                            {node.isDirectory ? "📁" : "📄"}
                        </span>
                        <span className="tree-node__name">{node.name}</span>
                    </div>
                    {node.children && node.children.length > 0 && (
                        <Tree
                            data={node.children}
                            onSelect={onSelect}
                            selected={selected}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

Tree.displayName = "Tree";