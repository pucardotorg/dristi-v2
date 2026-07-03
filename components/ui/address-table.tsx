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

type AddressRow = Partial<AddressForm> & Pick<AddressForm, "address">;

type AddressCol<T extends AddressRow> = { key: keyof T; header: string };

interface AddressTableProps<T extends AddressRow = AddressRow> {
  rows: T[];
  onAdd: (index: number) => void;
  onEdit: (index: number) => void;
  cols?: AddressCol<T>[];
}

const DEFAULT_COLS: AddressCol<AddressRow>[] = [
  { key: "address", header: "Address" },
  { key: "pincode", header: "Pincode" },
  { key: "district", header: "District" },
  { key: "state", header: "State" },
];

export function AddressTable<T extends AddressRow>({
  rows,
  onAdd,
  onEdit,
  cols = DEFAULT_COLS as AddressCol<T>[],
}: AddressTableProps<T>) {
  const isEmpty = !rows || rows.length === 0;
  const list: T[] = isEmpty ? ([{} as T] as T[]) : rows;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Sl.No</TableHead>
            {cols.map((c) => (
              <TableHead key={String(c.key)}>{c.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((a, i) => (
            <TableRow key={i}>
              <TableCell>{i + 1}</TableCell>
              {cols.map((c) => {
                const key = c.key as keyof T;
                const value = a[key];
                return (
                  <TableCell key={String(key)}>
                    {key === "address" ? (
                      a.address ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => onEdit(i)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          {a.address}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => onAdd(i)}>
                          <Plus className="w-3.5 h-3.5" />
                          Add Address
                        </Button>
                      )
                    ) : (
                      String(value ?? "")
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          {!isEmpty && rows[rows.length - 1]?.address && (
            <TableRow>
              <TableCell colSpan={cols.length + 1}>
                <Button variant="outline" size="sm" onClick={() => onAdd(rows.length)}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Address
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
