"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type FetchedUser = {
  name: string;
  age: string | null;
  email: string | null;
  addresses: { address: string; pincode: string; district: string; state: string; country: string }[];
};

interface FetchDetailsProps {
  description: string;
  fetchedLabel?: string;
  phone?: string;
  onFetched?: (data: FetchedUser) => void;
}

type State = "idle" | "loading" | "done" | "not_found" | "error";

export function FetchDetails({
  description,
  fetchedLabel = "Details fetched successfully",
  phone,
  onFetched,
}: FetchDetailsProps) {
  const [state, setState] = useState<State>("idle");

  const canFetch = !!phone && phone.replace(/\D/g, "").length >= 10;

  const handleClick = async () => {
    if (state !== "idle" || !canFetch) return;
    setState("loading");
    try {
      const res = await fetch(`/api/party/lookup?phone=${encodeURIComponent(phone!)}`);
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      if (data.found) {
        setState("done");
        onFetched?.(data as FetchedUser);
      } else {
        setState("not_found");
        setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {state === "done" ? (
        <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          <Check className="w-4 h-4" />
          {fetchedLabel}
        </div>
      ) : state === "not_found" ? (
        <div className="text-sm text-red-500">No user found with this number</div>
      ) : state === "error" ? (
        <div className="text-sm text-red-500">Lookup failed, please try again</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={state === "loading" || !canFetch}
        >
          {state === "loading" ? "Fetching…" : "Fetch Details"}
        </Button>
      )}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>{description}</AlertDescription>
      </Alert>
    </div>
  );
}
