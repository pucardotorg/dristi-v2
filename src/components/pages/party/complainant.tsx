"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useFilingStore } from "@/src/stores/filing-store";
import { Info } from "lucide-react";

// shadcn / shared UI
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { NumStepper } from "@/components/ui/num-stepper";
import { EntityTabs } from "@/components/ui/entity-tabs";
import { PhoneInput } from "@/components/ui/phone-input";
import { FetchDetails } from "@/components/ui/fetch-details";
import { SingleAddressTable } from "@/components/ui/single-address-table";
import { AddressModal, type AddressForm } from "@/components/ui/address-modal";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { InlineRadios } from "@/components/ui/inline-radios";
import { SectionSep } from "@/components/ui/section-sep";
import { Subhead } from "@/components/ui/subhead";
import { PageTitle } from "@/components/ui/page-title";
import { RemoveConfirmDialog, useRemoveConfirm } from "@/components/ui/remove-confirm-dialog";

import { YES_NO, COMPLAINANT_TYPES, ENTITY_TYPES } from "@/src/data/lookups";
import {
  validateField,
  validateAllFields,
  isPhoneMatched,
  phoneRegex,
} from "@/src/validation/complainant-schema";
import type { Complainant } from "@/src/types";

// ── Main page ────────────────────────────────────────────────────────────────

interface ComplainantPageProps {
  registerValidator?: (fn: () => boolean) => void;
}

export function ComplainantPage({ registerValidator }: ComplainantPageProps) {
  const data = useFilingStore((s) => s.data);
  const updateComplainant = useFilingStore((s) => s.updateComplainant);
  const addComplainant = useFilingStore((s) => s.addComplainant);
  const removeComplainant = useFilingStore((s) => s.removeComplainant);

  const [activeTab, setActiveTab] = useState("c1");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [modal, setModal] = useState<{
    key?: string;
    index?: number;
    initial?: AddressForm;
  } | null>(null);

  const complainantIds = Object.keys(data.complainants);
  const c: Complainant = data.complainants[activeTab] ?? {};

  const u = useCallback(
    (k: keyof Complainant, v: string | boolean) => {
      updateComplainant(activeTab, { [k]: v });

      if (k === "complainantType" && v !== "Entity") {
        updateComplainant(activeTab, { entityType: "", entityName: "" });
        setFieldErrors((prev) => {
          const n = { ...prev };
          delete n.entityType;
          delete n.entityName;
          return n;
        });
      }
      if (k === "presentSameAsPermanent" && v === "yes") {
        updateComplainant(activeTab, {
          presentAddresses: [
            { address: "", pincode: "", district: "", state: "", country: "India" },
          ],
        });
      }
      if (k === "hasPoA" && v !== "yes") {
        updateComplainant(activeTab, {
          poaPhone: "",
          poaPhoneConfirm: "",
          poaName: "",
          poaAge: "",
          poaEmail: "",
          poaPermanentAddresses: [
            { address: "", pincode: "", district: "", state: "", country: "India" },
          ],
          poaPresentSameAsPermanent: "yes",
          poaPresentAddresses: [
            { address: "", pincode: "", district: "", state: "", country: "India" },
          ],
        });
        setFieldErrors((prev) => {
          const n = { ...prev };
          ["poaPhone", "poaPhoneConfirm", "poaName", "poaAge", "poaEmail"].forEach(
            (f) => delete n[f]
          );
          return n;
        });
      }
      if (k === "partyInPerson" && v !== "yes") {
        updateComplainant(activeTab, { affidavitText: "" });
      }

      if (typeof v === "string") {
        const updated = { ...c, [k]: v };
        const err = validateField(updated, k);
        setFieldErrors((prev) => {
          if (err) return { ...prev, [k]: err };
          const next = { ...prev };
          delete next[k];
          return next;
        });
      }
    },
    [activeTab, c, updateComplainant]
  );

  const removeConfirm = useRemoveConfirm((id) => {
    removeComplainant(id);
    if (activeTab === id) {
      switchTab(complainantIds.find((k) => k !== id) ?? complainantIds[0]);
    }
  });

  const handleRemoveTab = (id: string) => {
    if (complainantIds.length <= 1) return;
    removeConfirm.requestRemove(id);
  };

  const switchTab = (id: string) => {
    setActiveTab(id);
    setFieldErrors({});
    setSubmitAttempted(false);
  };

  const cRef = useRef(c);
  cRef.current = c;

  useEffect(() => {
    registerValidator?.(() => {
      const errors = validateAllFields(cRef.current);
      if (Object.keys(errors).length > 0) {
        setSubmitAttempted(true);
        return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Address modal
  const openAddressModal = (key: string, index = 0) => {
    const rows =
      (c as unknown as Record<string, AddressForm[]>)[key] || [{} as AddressForm];
    setModal({ key, index, initial: rows[index] || ({} as AddressForm) });
  };

  const saveAddress = (val: AddressForm) => {
    if (!modal?.key) return;
    const key = modal.key as keyof Complainant;
    const rows = [
      ...((c as unknown as Record<string, AddressForm[]>)[key] || [{} as AddressForm]),
    ];
    rows[modal.index!] = val;
    updateComplainant(activeTab, {
      [key]: rows as unknown as Complainant[typeof key],
    });
    setModal(null);
  };

  const tabs = complainantIds.map((id) => ({
    id,
    label: `Complainant ${id.replace("c", "")}`,
    done: false,
  }));

  const phoneOk = isPhoneMatched(c) ? "Mobile number matched" : undefined;
  const poaPhoneOk =
    c.poaPhone &&
    c.poaPhone === c.poaPhoneConfirm &&
    phoneRegex.test(c.poaPhoneConfirm ?? "")
      ? "Mobile number matched"
      : undefined;
  const isEntity = c.complainantType === "Entity";
  const isPartyInPerson = c.partyInPerson === "yes";
  const hasPoA = c.hasPoA === "yes";

  const displayErrors: Record<string, string> = submitAttempted
    ? { ...validateAllFields(c), ...fieldErrors }
    : fieldErrors;

  return (
    <div>
      <PageTitle title="Complainant details">
        <NumStepper
          label="Number of complainants in the case"
          value={complainantIds.length}
          onChange={(n) => {
            const current = complainantIds.length;
            if (n > current) {
              addComplainant();
            } else if (n < current && current > 1) {
              const lastId = complainantIds[complainantIds.length - 1];
              handleRemoveTab(lastId);
            }
          }}
        />
      </PageTitle>

      <EntityTabs
        tabs={tabs}
        activeId={activeTab}
        onPick={switchTab}
        onAdd={addComplainant}
        addLabel={`Add Complainant${complainantIds.length > 1 ? " (× to remove)" : ""}`}
        onRemove={handleRemoveTab}
      />

      {/* ───── Basic Information ───── */}
      <SectionSep label="Basic Information" />

      <div className="field-stack">
        <FormField label="Are you representing yourselves as a Party in Person?">
          <InlineRadios
            value={c.partyInPerson ?? ""}
            onChange={(v) => u("partyInPerson", v as Complainant["partyInPerson"])}
            options={YES_NO}
          />
        </FormField>

        <FormField
          label="Complainant Type"
          required
          error={displayErrors.complainantType}
        >
          <NativeSelect
            value={c.complainantType ?? ""}
            onChange={(v) =>
              u("complainantType", v as Complainant["complainantType"])
            }
            options={[...COMPLAINANT_TYPES]}
          />
        </FormField>

        {isEntity && (
          <div className="reveal-section">
            <div className="field-stack">
              <FormField
                label="Type of Entity"
                required
                error={displayErrors.entityType}
              >
                <NativeSelect
                  value={c.entityType ?? ""}
                  onChange={(v) => u("entityType", v)}
                  options={[...ENTITY_TYPES]}
                />
              </FormField>
              <FormField
                label="Entity Name"
                required
                error={displayErrors.entityName}
              >
                <Input
                  value={c.entityName ?? ""}
                  onChange={(e) => u("entityName", e.target.value)}
                />
              </FormField>
            </div>
          </div>
        )}

        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Please add the complainant&apos;s number here as this number will be
            used to register the complainant on the court portal. Please
            don&apos;t add the advocate&apos;s number here.
          </AlertDescription>
        </Alert>

        <FormField label="Mobile Number" required error={displayErrors.phone}>
          <PhoneInput
            value={c.phone ?? ""}
            onChange={(v) => u("phone", v)}
          />
        </FormField>

        <FormField
          label="Confirm Mobile Number"
          required
          ok={phoneOk}
          error={displayErrors.phoneConfirm}
        >
          <PhoneInput
            value={c.phoneConfirm ?? ""}
            onChange={(v) => u("phoneConfirm", v)}
          />
        </FormField>

        <FormField label="Fetch details from court database">
          <FetchDetails
            phone={c.phone}
            description="Where this user is already registered in the 24×7 ON Court, you can fetch their contact, address, and other details from the court database."
            fetchedLabel="Complainant details fetched successfully"
            onFetched={(d) => {
              updateComplainant(activeTab, {
                repName: c.repName || d.name,
                repAge: c.repAge || d.age || "",
                email: c.email || d.email || "",
                permanentAddresses: c.permanentAddresses?.length
                  ? c.permanentAddresses
                  : d.addresses,
              });
            }}
          />
        </FormField>

        <FormField label="Full Name" required error={displayErrors.repName}>
          <Input
            value={c.repName ?? ""}
            onChange={(e) => u("repName", e.target.value)}
          />
        </FormField>

        <FormField label="Age" required error={displayErrors.repAge}>
          <Input
            type="number"
            inputMode="numeric"
            value={c.repAge ?? ""}
            onChange={(e) => u("repAge", e.target.value)}
            placeholder="Enter Age"
          />
        </FormField>

        <FormField label="Email Address" optional error={displayErrors.email}>
          <Input
            value={c.email ?? ""}
            onChange={(e) => u("email", e.target.value)}
            placeholder="Enter mail"
          />
        </FormField>
      </div>

      {/* ───── Permanent Address ───── */}
      <SectionSep label="Permanent Address" info />
      <SingleAddressTable
        rows={c.permanentAddresses ?? []}
        onAdd={() => openAddressModal("permanentAddresses", 0)}
        onEdit={() => openAddressModal("permanentAddresses", 0)}
      />

      <div className="field-stack-mt">
        <FormField label="Is the Present Address the same as the Permanent Address?">
          <InlineRadios
            value={c.presentSameAsPermanent ?? ""}
            onChange={(v) =>
              u(
                "presentSameAsPermanent",
                v as Complainant["presentSameAsPermanent"]
              )
            }
            options={YES_NO}
          />
        </FormField>
      </div>

      {/* ───── Present Address ───── */}
      {c.presentSameAsPermanent !== "yes" && (
        <div className="reveal-section">
          <SectionSep label="Present Address" info />
          <SingleAddressTable
            rows={c.presentAddresses ?? []}
            onAdd={() => openAddressModal("presentAddresses", 0)}
            onEdit={() => openAddressModal("presentAddresses", 0)}
          />
        </div>
      )}

      {/* ───── Power of Attorney ───── */}
      <Subhead>Power of Attorney (PoA) details</Subhead>

      <div className="field-stack">
        <FormField label="Has the complainant authorized any person as their power of attorney in this case?">
          <InlineRadios
            value={c.hasPoA ?? ""}
            onChange={(v) => u("hasPoA", v as Complainant["hasPoA"])}
            options={YES_NO}
          />
        </FormField>
      </div>

      {hasPoA && (
        <div className="reveal-section">
          <SectionSep
            label="Power of Attorney (PoA) Holder's Basic details"
            strong
          />

          <div className="field-stack">
            <FormField
              label="Mobile Number"
              required
              error={displayErrors.poaPhone}
            >
              <PhoneInput
                value={c.poaPhone ?? ""}
                onChange={(v) => u("poaPhone", v)}
              />
            </FormField>

            <FormField
              label="Confirm Mobile Number"
              required
              ok={poaPhoneOk}
              error={displayErrors.poaPhoneConfirm}
            >
              <PhoneInput
                value={c.poaPhoneConfirm ?? ""}
                onChange={(v) => u("poaPhoneConfirm", v)}
              />
            </FormField>

            <FormField label="Fetch details from court database">
              <FetchDetails
                phone={c.poaPhone}
                description="Where this user is already registered in the 24×7 ON Court, you can fetch this user's contact, address, and other details from the court database."
                fetchedLabel="PoA holder details fetched successfully"
                onFetched={(d) => {
                  updateComplainant(activeTab, {
                    poaName: c.poaName || d.name,
                    poaAge: c.poaAge || d.age || "",
                    poaEmail: c.poaEmail || d.email || "",
                    poaPermanentAddresses: c.poaPermanentAddresses?.length
                      ? c.poaPermanentAddresses
                      : d.addresses,
                  });
                }}
              />
            </FormField>

            <FormField
              label="Full Name"
              required
              error={displayErrors.poaName}
            >
              <Input
                value={c.poaName ?? ""}
                onChange={(e) => u("poaName", e.target.value)}
              />
            </FormField>

            <FormField label="Age" required error={displayErrors.poaAge}>
              <Input
                type="number"
                inputMode="numeric"
                value={c.poaAge ?? ""}
                onChange={(e) => u("poaAge", e.target.value)}
                placeholder="Enter Age"
              />
            </FormField>

            <FormField label="Email Address" error={displayErrors.poaEmail}>
              <Input
                value={c.poaEmail ?? ""}
                onChange={(e) => u("poaEmail", e.target.value)}
                placeholder="Enter mail"
              />
            </FormField>
          </div>

          {/* PoA Permanent Address */}
          <SectionSep label="Permanent address" info />
          <SingleAddressTable
            rows={c.poaPermanentAddresses ?? []}
            onAdd={() => openAddressModal("poaPermanentAddresses", 0)}
            onEdit={() => openAddressModal("poaPermanentAddresses", 0)}
          />

          <div className="field-stack-mt">
            <FormField label="Is the Present address the same as the Permanent address?">
              <InlineRadios
                value={c.poaPresentSameAsPermanent ?? ""}
                onChange={(v) =>
                  u(
                    "poaPresentSameAsPermanent",
                    v as Complainant["poaPresentSameAsPermanent"]
                  )
                }
                options={YES_NO}
              />
            </FormField>
          </div>

          {c.poaPresentSameAsPermanent !== "yes" && (
            <div className="reveal-section">
              <SectionSep label="Present address" info />
              <SingleAddressTable
                rows={c.poaPresentAddresses ?? []}
                onAdd={() => openAddressModal("poaPresentAddresses", 0)}
                onEdit={() => openAddressModal("poaPresentAddresses", 0)}
              />
            </div>
          )}
        </div>
      )}

      {/* ───── Affidavit (only when Party in Person) ───── */}
      {isPartyInPerson && (
        <div className="reveal-section">
          <Subhead>Affidavit for appearing as party in person</Subhead>
          <RichTextEditor
            value={c.affidavitText || data.partyInPersonAffidavitDefault}
            onChange={(v) => u("affidavitText", v)}
            minHeight={160}
          />
        </div>
      )}

      <RemoveConfirmDialog
        entityName="Complainant"
        open={removeConfirm.open}
        onCancel={removeConfirm.cancel}
        onConfirm={removeConfirm.confirm}
      />

      {/* Address Modal */}
      <AddressModal
        open={!!modal}
        title={
          modal?.key?.includes("present")
            ? "Add Present Address"
            : "Add Permanent Address"
        }
        initial={modal?.initial}
        onClose={() => setModal(null)}
        onConfirm={saveAddress}
      />
    </div>
  );
}
