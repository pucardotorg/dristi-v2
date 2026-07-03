"use client";

import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ContactRow {
  phone: string;
  email: string;
}

interface ContactTableProps {
  rows: ContactRow[];
  onChange: (rows: ContactRow[]) => void;
}

export function ContactTable({ rows, onChange }: ContactTableProps) {
  const updateRow = (i: number, key: keyof ContactRow, val: string) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r));
    onChange(next);
  };

  const addRow = () => onChange([...rows, { phone: "", email: "" }]);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Sl.No</TableHead>
            <TableHead>Mobile Number</TableHead>
            <TableHead>Email ID</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={r.phone}
                  onChange={(e) => updateRow(i, "phone", e.target.value)}
                  placeholder="Enter Mobile Number"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={r.email}
                  onChange={(e) => updateRow(i, "email", e.target.value)}
                  placeholder="ex: xyz@gmail.com"
                />
              </TableCell>
              <TableCell>
                {i === rows.length - 1 && (
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:text-teal/80"
                  >
                    <Plus className="w-4 h-4" />
                    Add More
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
