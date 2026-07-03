"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { STATES, COUNTRIES } from "@/src/data/lookups";

export interface AddressForm {
  address: string;
  pincode: string;
  district: string;
  state: string;
  country: string;
}

interface AddressModalProps {
  open: boolean;
  title: string;
  initial?: AddressForm;
  onClose: () => void;
  onConfirm: (addr: AddressForm) => void;
}

const EMPTY: AddressForm = {
  address: "",
  pincode: "",
  district: "",
  state: "",
  country: "India",
};

export function AddressModal({
  open,
  title,
  initial,
  onClose,
  onConfirm,
}: AddressModalProps) {
  const [form, setForm] = useState<AddressForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm(initial ? { ...EMPTY, ...initial } : { ...EMPTY });
      setErrors({});
    }
  }, [open, initial]);

  const set = (k: keyof AddressForm, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof AddressForm, string>> = {};
    if (!form.address || form.address.trim().length < 5)
      e.address = "Enter at least 5 characters";
    if (!/^\d{6}$/.test(form.pincode))
      e.pincode = "Enter valid 6-digit pincode";
    if (!form.district.trim()) e.district = "District is required";
    if (!form.state) e.state = "Select a state";
    if (!form.country) e.country = "Select a country";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm({ ...form, address: form.address.trim() });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Address */}
          <div className="grid gap-1.5">
            <Label>
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              rows={3}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Enter full address"
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address}</p>
            )}
          </div>

          {/* Pincode */}
          <div className="grid gap-1.5">
            <Label>
              Pincode <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.pincode}
              onChange={(e) =>
                set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit pincode"
            />
            {errors.pincode && (
              <p className="text-xs text-red-500">{errors.pincode}</p>
            )}
          </div>

          {/* District */}
          <div className="grid gap-1.5">
            <Label>
              District <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
              placeholder="Enter district"
            />
            {errors.district && (
              <p className="text-xs text-red-500">{errors.district}</p>
            )}
          </div>

          {/* State */}
          <div className="grid gap-1.5">
            <Label>
              State <span className="text-red-500">*</span>
            </Label>
            <NativeSelect
              value={form.state}
              onChange={(v) => set("state", v)}
              options={[...STATES]}
              placeholder="Select State"
            />
            {errors.state && (
              <p className="text-xs text-red-500">{errors.state}</p>
            )}
          </div>

          {/* Country */}
          <div className="grid gap-1.5">
            <Label>
              Country <span className="text-red-500">*</span>
            </Label>
            <NativeSelect
              value={form.country}
              onChange={(v) => set("country", v)}
              options={[...COUNTRIES]}
              placeholder="Select Country"
            />
            {errors.country && (
              <p className="text-xs text-red-500">{errors.country}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
