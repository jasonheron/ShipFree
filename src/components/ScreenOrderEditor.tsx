// src/components/ScreenOrderEditor.tsx
"use client";

import { useState, useRef } from 'react';
import { updateScreenOrder } from '@/app/screens/actions';
import { GripVertical } from 'lucide-react';

type Screen = {
  id: string;
  name: string;
};

interface ScreenOrderEditorProps {
  initialScreens: Screen[];
  groupId: string;
}

export default function ScreenOrderEditor({ initialScreens, groupId }: ScreenOrderEditorProps) {
  const [screens, setScreens] = useState(initialScreens);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const newScreens = [...screens];
    const dragItemContent = newScreens[dragItem.current];
    newScreens.splice(dragItem.current, 1);
    newScreens.splice(dragOverItem.current, 0, dragItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    setScreens(newScreens);
  };

  const orderedScreenIds = screens.map(s => s.id);

  return (
    <div className="p-6 bg-white border rounded-lg">
      <div className="mb-4">
        <h3 className="font-semibold">Screen Order</h3>
        <p className="text-sm text-gray-500">Drag and drop to reorder screens. The top screen is #1.</p>
      </div>
      <div className="space-y-2">
        {screens.map((screen, index) => (
          <div
            key={screen.id}
            className="flex items-center p-3 bg-gray-50 border rounded-md cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <GripVertical className="h-5 w-5 text-gray-400 mr-3" />
            <div className="flex-grow">
              <p className="font-medium text-sm">{screen.name}</p>
              <p className="text-xs text-gray-400 font-mono">{screen.id}</p>
            </div>
          </div>
        ))}
      </div>
      <form action={updateScreenOrder} className="mt-4">
        <input type="hidden" name="group_id" value={groupId} />
        <input type="hidden" name="ordered_ids" value={JSON.stringify(orderedScreenIds)} />
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Screen Order
        </button>
      </form>
    </div>
  );
}
