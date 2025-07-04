// src/components/ScreenSettings.tsx
"use client";

import { useState } from "react";
import { Settings, Trash2 } from "lucide-react";
import { deleteScreen } from "@/app/screens/actions";

// Define the shape of the screen prop
type Screen = {
  id: string;
  name: string;
  resolution: string | null;
  orientation: string | null;
  pairing_code: string | null;
};

export default function ScreenSettings({ screen }: { screen: Screen }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${screen.name}"? This action cannot be undone and will release its license.`)) {
        const formData = new FormData();
        formData.append('screen_id', screen.id);
        await deleteScreen(formData);
        setIsOpen(false); // Close modal on delete
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
        title="Screen Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Settings for "{screen.name}"</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            
            <div className="space-y-4">
              {/* Future editing form would go here */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Resolution</label>
                <input type="text" defaultValue={screen.resolution ?? '1920x1080'} className="w-full border p-2 rounded bg-gray-50" readOnly />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Pairing Code</label>
                <input type="text" value={screen.pairing_code ?? 'Already Paired'} className="w-full border p-2 rounded bg-gray-50" readOnly />
              </div>
            </div>

            <div className="mt-6 border-t pt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">Delete this screen permanently.</p>
                <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Screen
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
