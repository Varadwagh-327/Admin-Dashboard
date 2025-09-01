"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableCard({
  id,
  title,
  children,
  onRemove,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform) || undefined,
    transition,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="font-medium text-sm">{title}</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Hide card"
          className="text-sm px-2 py-1 rounded hover:bg-gray-100"
        >
          ✕
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
