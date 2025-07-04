// src/components/ScreenControls.tsx
"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, RefreshCcw } from "lucide-react";
import { updateScreen, deleteScreen, regeneratePairingCode } from "@/app/screens/actions";

type Screen = {
  id: string;
  name: string;
  pairing_code: string | null;
};

export default function ScreenControls({ screen }: { screen: Screen }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(screen.name);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${screen.name}"? This will release its license.`)) {
      const formData = new FormData();
      formData.append('screen_id', screen.id);
      deleteScreen(formData);
    }
  };

  const handleUpdate = (formData: FormData) => {
    updateScreen(formData).then(() => {
        setIsEditing(false);
        setIsMenuOpen(false);
    });
  };

  const handleRegenerateCode = () => {
    if (window.confirm(`Generate a new pairing code for "${screen.name}"? The old code will no longer work.`)) {
        const formData = new FormData();
        formData.append('screen_id', screen.id);
        regeneratePairingCode(formData);
        // You might want to show the new code in a toast/modal here
        alert('A new pairing code has been generated. Please check the screen settings page.');
        setIsMenuOpen(false);
    }
  }

  return (
    <>
      <div className="relative">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-gray-200 rounded-full">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
            <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Pencil className="h-4 w-4" /> Rename
            </button>
            <button onClick={handleRegenerateCode} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <RefreshCcw className="h-4 w-4" /> New Pair Code
            </button>
            <button onClick={handleDelete} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>

      {isEditing && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Rename Screen</h2>
            <form action={handleUpdate}>
              <input type="hidden" name="screen_id" value={screen.id} />
              <input
                type="text"
                name="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
