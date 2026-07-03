"use client";

import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AddressForm } from "@/components/ui/address-modal";

interface SingleAddressTableProps {
  rows: AddressForm[];
  onAdd: () => void;
  onEdit: () => void;
}

export function SingleAddressTable({ rows, onAdd, onEdit }: SingleAddressTableProps) {
  const a = rows?.[0];
  const filled = !!a?.address;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Sl.No</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Pincode</TableHead>
            <TableHead>District</TableHead>
            <TableHead>State</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
            <TableCell>
              {filled ? (
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={onEdit}>
                  <Pencil className="w-3 h-3 mr-1" />
                  {a.address}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onAdd}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Address
                </Button>
              )}
            </TableCell>
            <TableCell>{a?.pincode || ""}</TableCell>
            <TableCell>{a?.district || ""}</TableCell>
            <TableCell>{a?.state || ""}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
