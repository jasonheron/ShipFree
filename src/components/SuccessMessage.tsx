"use client";

import { useSearchParams } from "next/navigation";

export function SuccessMessage({ param = "success", text = "Success!" }) {
  const searchParams = useSearchParams();
  const hasParam = searchParams.has(param);

  if (!hasParam) return null;

  return (
    <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
      {text}
    </div>
  );
}
