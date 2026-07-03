"use client";

import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRemoveConfirm(onConfirm: (id: string) => void) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const requestRemove = useCallback((id: string) => setPendingId(id), []);
  const cancel = useCallback(() => setPendingId(null), []);
  const confirm = useCallback(() => {
    if (pendingId) {
      onConfirm(pendingId);
      setPendingId(null);
    }
  }, [pendingId, onConfirm]);

  return { open: !!pendingId, pendingId, requestRemove, confirm, cancel };
}

// ── Component ────────────────────────────────────────────────────────────────

interface RemoveConfirmDialogProps {
  open: boolean;
  entityName: string;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function RemoveConfirmDialog({
  open,
  entityName,
  onCancel,
  onConfirm,
  title,
  description,
}: RemoveConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title ?? `Remove ${entityName}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              `Are you sure you want to delete the details of this ${entityName.toLowerCase()}?`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Yes, Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
