"use client";

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createScreen, type FormState } from '@/app/screens/actions';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
            {pending ? "Creating..." : "Create Screen & Get Code"}
        </button>
    );
}

// Define the props for our form component
type Site = { id: string; name: string };
type ScreenGroup = { id: string; name: string };
interface CreateScreenFormProps {
    sites: Site[];
    screenGroups: ScreenGroup[]; // Add screenGroups to props
}

export default function CreateScreenForm({ sites, screenGroups }: CreateScreenFormProps) {
    const initialState: FormState = { error: null };
    const [state, formAction] = useActionState(createScreen, initialState);

    return (
        <>
            {/* Error messages */}
            {state?.error === "nolicense" && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                    🚫 No licenses available. Contact support to add more licenses.
                </div>
            )}
            {state?.error === "db_error" && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                    ❌ There was an error creating the screen. Please try again.
                </div>
            )}
            {state?.error === "missing_fields" && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                    ❌ Please fill out all fields, including Location and Group.
                </div>
            )}

            <form action={formAction} className="space-y-4 max-w-md">
                {/* Screen Name Input */}
                <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Screen Name</label>
                    <input id="name" type="text" name="name" required placeholder="e.g., Main Entrance Display" className="w-full border p-2 rounded" />
                </div>

                {/* Location (Site) Dropdown */}
                <div className="space-y-1">
                    <label htmlFor="site_id" className="text-sm font-medium text-gray-700">Location</label>
                    <select id="site_id" name="site_id" required className="w-full border p-2 rounded" defaultValue="">
                        <option value="" disabled>Select a Location</option>
                        {sites?.map((site) => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                    </select>
                </div>

                {/* Screen Group Dropdown */}
                <div className="space-y-1">
                    <label htmlFor="screen_group_id" className="text-sm font-medium text-gray-700">Assign to Group</label>
                    <select id="screen_group_id" name="screen_group_id" required className="w-full border p-2 rounded" defaultValue="">
                        <option value="" disabled>Select a Group</option>
                        {screenGroups?.map((group) => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                    </select>
                </div>

                <SubmitButton />
            </form>
        </>
    );
}