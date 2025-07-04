// src/components/MediaManager.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

export default function MediaManager({ initialMediaFiles }: { initialMediaFiles: any[] }) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mediaFiles, setMediaFiles] = useState<any[]>(initialMediaFiles);

  const handleUpload = async () => {
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;

      // 1. Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("media") // Make sure 'media' is your bucket name
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error("Could not get public URL for the file.");
      }
      const publicUrl = urlData.publicUrl;

      // 3. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to upload files.");
      }

      // 4. Insert file metadata into the database
      const { data: newMedia, error: insertError } = await supabase
        .from("media_table")
        .insert([
          {
            user_id: user.id,
            file_name: file.name,
            file_url: publicUrl,
            storage_path: fileName, // Important for deletions
            file_type: file.type.startsWith("video") ? "video" : "image",
          },
        ])
        .select()
        .single(); // Use .select().single() to get the newly inserted row

      if (insertError) {
        throw insertError;
      }
      
      // 5. Update UI state
      setMediaFiles((prevFiles) => [newMedia, ...prevFiles]);
      setSuccess("File uploaded successfully!");
      setFile(null); // Clear the file input

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    setError("");
    setSuccess("");

    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      // 1. Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("media")
        .remove([storagePath]);

      if (storageError) {
        throw storageError;
      }

      // 2. Delete from the database
      const { error: deleteError } = await supabase
        .from("media_table")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      // 3. Update UI state
      setMediaFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
      setSuccess("File deleted successfully.");

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during deletion.");
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Upload New Media</h2>
      <div className="flex items-center gap-4 mb-6 pb-6 border-b">
        <input
          key={file?.name || 'file-input'} // Add key to reset the input field
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mediaFiles.map((media) => (
          <div
            key={media.id}
            className="border rounded-md overflow-hidden group relative"
          >
            {media.file_type === "image" ? (
              <img src={media.file_url} alt={media.file_name} className="w-full h-32 object-cover" />
            ) : (
              <video src={media.file_url} controls className="w-full h-32"></video>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDelete(media.id, media.storage_path)}
                className="text-white text-xs bg-red-600 hover:bg-red-700 rounded-full p-2"
              >
                Delete
              </button>
            </div>
            <p className="text-xs p-2 truncate" title={media.file_name}>
              {media.file_name}
            </p>
          </div>
        ))}
      </div>
       {mediaFiles.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            <p>No media files found. Upload your first file!</p>
          </div>
        )}
    </div>
  );
}