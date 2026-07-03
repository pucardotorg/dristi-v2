"use client";

import { useState, useCallback } from "react";
import { useFilingStore } from "@/src/stores/filing-store";
import { Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { NumStepper } from "@/components/ui/num-stepper";
import { EntityTabs } from "@/components/ui/entity-tabs";
import { PageTitle } from "@/components/ui/page-title";
import { SectionSep } from "@/components/ui/section-sep";
import { Subhead } from "@/components/ui/subhead";
import { NativeSelect } from "@/components/ui/native-select";
import { InlineRadios } from "@/components/ui/inline-radios";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContactTable } from "@/components/ui/contact-table";
import { AddressTable } from "@/components/ui/address-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddressModal, type AddressForm } from "@/components/ui/address-modal";
import { RemoveConfirmDialog, useRemoveConfirm } from "@/components/ui/remove-confirm-dialog";

import {
  ACCUSED_PARTY_TYPES,
  ENTITY_TYPES,
  SALUTATIONS,
  YES_NO,
} from "@/src/data/lookups";
import type { Accused, AccusedAddress } from "@/src/types";

// ── Address modal adapter (AccusedAddress ↔ AddressForm) ──────────────────────

function useAddressModal(
  addresses: AccusedAddress[],
  onUpdate: (addresses: AccusedAddress[]) => void
) {
  const [modal, setModal] = useState<{ index: number | null } | null>(null);

  const openAdd = () => setModal({ index: null });
  const openEdit = (index: number) => setModal({ index });
  const close = () => setModal(null);

  const initial =
    modal?.index != null
      ? { ...addresses[modal.index], country: "India" }
      : undefined;

  const handleConfirm = (form: AddressForm) => {
    const addr: AccusedAddress = {
      address: form.address,
      pincode: form.pincode,
      district: form.district,
      state: form.state,
    };
    if (modal?.index != null) {
      onUpdate(addresses.map((a, i) => (i === modal.index ? addr : a)));
    } else {
      onUpdate([...addresses, addr]);
    }
    close();
  };

  return { modal, openAdd, openEdit, close, initial, handleConfirm };
}

// ── No-contact warning modal (2-step) ─────────────────────────────────────────

function NoContactModal({
  open,
  onAddDetails,
  onConfirmedProceed,
  onClose,
}: {
  open: boolean;
  onAddDetails: () => void;
  onConfirmedProceed: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"warn" | "confirm">("warn");
  const [checked, setChecked] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      {step === "warn" ? (
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No electronic contact details added</DialogTitle>
            <DialogDescription>
              Adding contact details increases the chances of delivery of
              summons.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-lg text-sm font-medium transition-colors border bg-background text-foreground hover:bg-muted"
              onClick={() => setStep("confirm")}
            >
              Proceed without Details
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                onClose();
                onAddDetails();
              }}
            >
              Add Details
            </button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirm Proceed without Details</DialogTitle>
          </DialogHeader>
          <label className="flex items-start gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <span>
              I confirm that I have no knowledge of the accused&apos;s
              electronic contact details and cannot locate them with reasonable
              effort.
            </span>
          </label>
          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-lg text-sm font-medium transition-colors border bg-background text-foreground hover:bg-muted"
              onClick={() => {
                onClose();
                onAddDetails();
              }}
            >
              Add Details
            </button>
            <button
              type="button"
              disabled={!checked}
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              onClick={() => {
                onConfirmedProceed();
                onClose();
              }}
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AccusedPage() {
  const data = useFilingStore((s) => s.data);
  const updateAccused = useFilingStore((s) => s.updateAccused);
  const addAccused = useFilingStore((s) => s.addAccused);
  const removeAccused = useFilingStore((s) => s.removeAccused);

  const accusedIds = Object.keys(data.accused);
  const [activeTab, setActiveTab] = useState(accusedIds[0] ?? "a1");
  const [noContactModal, setNoContactModal] = useState(false);

  const removeConfirm = useRemoveConfirm((id) => {
    removeAccused(id);
    if (activeTab === id) {
      setActiveTab(accusedIds.find((k) => k !== id) ?? accusedIds[0]);
    }
  });

  const ac: Accused = data.accused[activeTab] ?? {
    accusedType: "Individual",
    fullName: "",
    age: "",
    entityType: "",
    companyName: "",
    repName: "",
    repDesignation: "",
    repContacts: [{ phone: "", email: "" }],
    repAddresses: [],
    contacts: [{ phone: "", email: "" }],
    addresses: [],
    withinJurisdiction: "yes",
  };

  const u = useCallback(
    (patch: Partial<Accused>) => updateAccused(activeTab, patch),
    [activeTab, updateAccused]
  );

  const handleRemoveTab = (id: string) => {
    if (accusedIds.length <= 1) return;
    removeConfirm.requestRemove(id);
  };

  const isIndividual = ac.accusedType === "Individual";
  const tabIdx = accusedIds.indexOf(activeTab) + 1;

  const addrModal = useAddressModal(ac.addresses, (addresses) => u({ addresses }));
  const repAddrModal = useAddressModal(ac.repAddresses, (repAddresses) =>
    u({ repAddresses })
  );

  const tabs = accusedIds.map((id, i) => ({
    id,
    label: `Accused ${i + 1}`,
    done: false,
  }));

  const hasNoContact = ac.contacts.every((c) => !c.phone && !c.email);

  return (
    <div>
      <PageTitle title="Accused details">
        <NumStepper
          label="Number of accused in the case"
          value={accusedIds.length}
          onChange={(n) => {
            const current = accusedIds.length;
            if (n > current) {
              addAccused();
            } else if (n < current && current > 1) {
              const lastId = accusedIds[accusedIds.length - 1];
              handleRemoveTab(lastId);
            }
          }}
        />
      </PageTitle>

      <EntityTabs
        tabs={tabs}
        activeId={activeTab}
        onPick={setActiveTab}
        onAdd={addAccused}
        addLabel="Add Accused"
        onRemove={handleRemoveTab}
      />

      <div className="field-stack mt-6">
        <FormField label="Accused Type" required>
          <NativeSelect
            value={ac.accusedType}
            onChange={(v) => u({ accusedType: v })}
            options={[...ACCUSED_PARTY_TYPES]}
          />
        </FormField>

        {isIndividual ? (
          <div className="reveal-section field-stack">
            <FormField label="Full Name" required>
              <Input
                value={ac.fullName}
                onChange={(e) => u({ fullName: e.target.value })}
                placeholder="Enter"
              />
            </FormField>
            <FormField label="Age">
              <Input
                type="number"
                inputMode="numeric"
                value={ac.age}
                onChange={(e) => u({ age: e.target.value })}
                placeholder="Enter Age"
              />
            </FormField>
          </div>
        ) : (
          <div className="reveal-section field-stack">
            <FormField label="Type of Entity" required>
              <NativeSelect
                value={ac.entityType}
                onChange={(v) => u({ entityType: v })}
                options={[...ENTITY_TYPES]}
              />
            </FormField>
            <FormField label="Company Name" required>
              <Input
                value={ac.companyName}
                onChange={(e) => u({ companyName: e.target.value })}
                placeholder="Enter"
              />
            </FormField>
          </div>
        )}
      </div>

      <SectionSep
        label={`Accused ${tabIdx} ${isIndividual ? "Contact" : "Company Contact"} Details`}
      />
      <ContactTable rows={ac.contacts} onChange={(contacts) => u({ contacts })} />

      <SectionSep
        label={`Accused ${tabIdx} ${isIndividual ? "Address" : "Company Address"} Details`}
      />
      <Alert className="mb-3">
        <AlertDescription>
          Adding multiple addresses will increase your chances of successful
          delivery.
        </AlertDescription>
      </Alert>
      <AddressTable
        rows={ac.addresses}
        onAdd={addrModal.openAdd}
        onEdit={addrModal.openEdit}
      />
      <div className="mt-6 field-stack">
        <FormField
          label="Does the accused reside within the jurisdiction of this court?"
          required
        >
          <InlineRadios
            value={ac.withinJurisdiction}
            onChange={(v) => u({ withinJurisdiction: v as "yes" | "no" })}
            options={YES_NO}
          />
        </FormField>
        <Alert>
          <AlertDescription>
            Answer to this question does not necessarily impact the jurisdiction
            of the court.
          </AlertDescription>
        </Alert>
      </div>

      {!isIndividual && (
        <div className="reveal-section field-stack">
          <SectionSep label="Representative Details" />
          <div className="field-stack">
            <FormField label="Full Name" required>
              <Input
                value={ac.repName}
                onChange={(e) => u({ repName: e.target.value })}
                placeholder="Enter"
              />
            </FormField>
            <FormField label="Designation / Salutation">
              <NativeSelect
                value={ac.repDesignation}
                onChange={(v) => u({ repDesignation: v })}
                options={[...SALUTATIONS]}
              />
            </FormField>
          </div>
          <ContactTable
            rows={ac.repContacts}
            onChange={(repContacts) => u({ repContacts })}
          />
          <AddressTable
            rows={ac.repAddresses}
            onAdd={repAddrModal.openAdd}
            onEdit={repAddrModal.openEdit}
          />
          <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            You can add all persons vicariously liable for the company as
            Accused. A person vicariously liable for a company is a person who,
            at the time the offence was committed, was in charge of, and was
            responsible to, the entity for the conduct of the business of the
            entity corporate, except when the person is nominated as a Director
            of a body corporate by virtue of his holding any office or
            employment in the Central Government or State Government of a
            financial corporation owned or controlled by the Central Government
            or the State Government.
          </div>
        </div>
      )}

      <AddressModal
        open={addrModal.modal !== null}
        title="Add Address"
        initial={addrModal.initial}
        onClose={addrModal.close}
        onConfirm={addrModal.handleConfirm}
      />
      <AddressModal
        open={repAddrModal.modal !== null}
        title="Add Representative Address"
        initial={repAddrModal.initial}
        onClose={repAddrModal.close}
        onConfirm={repAddrModal.handleConfirm}
      />

      <RemoveConfirmDialog
        entityName="Accused"
        open={removeConfirm.open}
        onCancel={removeConfirm.cancel}
        onConfirm={removeConfirm.confirm}
      />

      <NoContactModal
        open={noContactModal}
        onAddDetails={() => setNoContactModal(false)}
        onConfirmedProceed={() => setNoContactModal(false)}
        onClose={() => setNoContactModal(false)}
      />

      <input type="hidden" data-accused-has-no-contact={hasNoContact ? "1" : "0"} />
    </div>
  );
}
