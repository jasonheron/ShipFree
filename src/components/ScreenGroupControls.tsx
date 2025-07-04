// src/components/ScreenGroupControls.tsx
"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { updateScreenGroup, deleteScreenGroup } from "@/app/screens/actions";

type Group = {
  id: string;
  name: string;
};

export default function ScreenGroupControls({ group }: { group: Group }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(group.name);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the group "${group.name}"? All screens within it will be unassigned.`)) {
      const formData = new FormData();
      formData.append('group_id', group.id);
      deleteScreenGroup(formData);
    }
  };

  const handleUpdate = (formData: FormData) => {
    updateScreenGroup(formData).then(() => {
        setIsEditing(false);
    });
  }

  return (
    <>
      <div className="relative">
        <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-gray-200 rounded-full">
            <Pencil className="h-4 w-4 text-gray-600" />
        </button>
        <button onClick={handleDelete} className="p-1 hover:bg-gray-200 rounded-full">
            <Trash2 className="h-4 w-4 text-red-600" />
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Group Name</h2>
            <form action={handleUpdate}>
              <input type="hidden" name="group_id" value={group.id} />
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
