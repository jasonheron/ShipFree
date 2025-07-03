"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export default async function MediaManager() {
  const supabase = await createClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);

  // Load existing files
  useEffect(() => {
    const fetchMedia = async () => {
      const { data, error } = await supabase
        .from("media_table")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching media:", error.message);
      } else {
        setMediaFiles(data || []);
      }
    };

    fetchMedia();
  }, [supabase]);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = fileName;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      setError("Failed to get public URL.");
      setUploading(false);
      return;
    }

    const publicUrl = urlData.publicUrl;

    // Get current user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("You must be logged in to upload files.");
      setUploading(false);
      return;
    }

    // Insert into media_table
    const { error: insertError } = await supabase.from("media_table").insert([
      {
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        storage_path: filePath, // store for easier deletion
        file_type: file.type.startsWith("video") ? "video" : "image",
      },
    ]);

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("File uploaded successfully!");
      setFile(null);

      // Refresh media list
      const { data, error } = await supabase
        .from("media_table")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setMediaFiles(data || []);
    }

    setUploading(false);
  };

  const handleDelete = async (id: string, storagePath: string) => {
    setError("");
    setSuccess("");

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("media")
      .remove([storagePath]);

    if (storageError) {
      setError(`Storage deletion error: ${storageError.message}`);
      return;
    }

    // Delete from table
    const { error: deleteError } = await supabase
      .from("media_table")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(`Database deletion error: ${deleteError.message}`);
    } else {
      setSuccess("File deleted successfully!");
      setMediaFiles((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Media Manager</h2>

      <div className="space-y-2">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {mediaFiles.map((file) => (
          <div
            key={file.id}
            className="border rounded p-2 flex flex-col items-center"
          >
            {file.file_type === "image" ? (
              <img src={file.file_url} alt={file.file_name} className="w-full" />
            ) : (
              <video
                src={file.file_url}
                controls
                className="w-full"
              ></video>
            )}
            <p className="text-sm mt-1">{file.file_name}</p>
            <button
              onClick={() => handleDelete(file.id, file.storage_path)}
              className="text-red-500 text-xs mt-1"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
