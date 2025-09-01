"use client";

import React, { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Local imports
import SortableCard from "./SortableCard";
import { makeCardDescriptors } from "./cardDescriptors";
import { CardId, DEFAULT_ORDER, LOCAL_ORDER_KEY, LOCAL_VISIBLE_KEY } from "../SeverSide/constants";
import { DashboardData } from "../SeverSide/types";

export default function TabComponent({ initialData }: { initialData?: DashboardData | null }) {
  const data = initialData ?? null;
  const descriptors = useMemo(() => makeCardDescriptors(data), [data]);

  const [order, setOrder] = useState<CardId[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_ORDER_KEY);
      if (raw) return JSON.parse(raw) as CardId[];
    } catch {}
    return DEFAULT_ORDER.slice();
  });

  const [visible, setVisible] = useState<Record<CardId, boolean>>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_VISIBLE_KEY);
      if (raw) return JSON.parse(raw) as Record<CardId, boolean>;
    } catch {}
    return Object.fromEntries(DEFAULT_ORDER.map((id) => [id, true])) as Record<CardId, boolean>;
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const visibleIds = useMemo(() => order.filter((id) => visible[id]), [order, visible]);



  function toggleVisibility(id: CardId) {
    const newVisible = { ...visible, [id]: !visible[id] };
    const newOrder = [...order];
    if (!newOrder.includes(id)) newOrder.push(id);
    setVisible(newVisible);
    setOrder(newOrder);
  }

  function resetLayout() {
    const newVisible: Record<CardId, boolean> = Object.fromEntries(DEFAULT_ORDER.map((id) => [id, true])) as Record<
      CardId,
      boolean
    >;
    setOrder(DEFAULT_ORDER.slice());
    setVisible(newVisible);
  }

  return (
    <div className="space-y-4">
      {/* Top bar: Tabs dropdown */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white border shadow-sm"
          >
            <span className="text-sm font-medium">Tabs</span>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
              <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white border rounded shadow-lg z-50">
              <div className="p-2">
                {Object.values(descriptors).map((d) => (
                  <label key={d.id} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={!!visible[d.id]}
                      onChange={() => toggleVisibility(d.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{d.title}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between px-2 py-2 border-t">
                <button onClick={() => { setMenuOpen(false); resetLayout(); }} className="text-sm px-2 py-1 hover:bg-gray-100">Reset</button>
                <button onClick={() => setMenuOpen(false)} className="text-sm px-2 py-1 hover:bg-gray-100">Close</button>
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={resetLayout} className="px-3 py-2 rounded bg-gray-100 text-sm">Reset</button>
        </div>
      </div>

      {/* Drag & drop grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;
        const visibleList = order.filter((id) => visible[id]) as CardId[];
        const oldIndex = visibleList.indexOf(active.id as CardId);
        const newIndex = visibleList.indexOf(over.id as CardId);
        if (oldIndex === -1 || newIndex === -1) return;
        const newVisibleOrder = arrayMove(visibleList, oldIndex, newIndex) as CardId[];
        setOrder(newVisibleOrder);
      }}>
        <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {visibleIds.map((id) => {
              const desc = descriptors[id];
              return (
                <SortableCard key={id} id={id} title={desc.title} onRemove={() => toggleVisibility(id)}>
                  {desc.render(data)}
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>{activeId ? <div className="w-80 p-4 bg-white rounded shadow">{descriptors[activeId as CardId]?.title}</div> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
