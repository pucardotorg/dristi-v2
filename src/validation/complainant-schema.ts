import { z } from "zod";

export const phoneRegex = /^[6-9]\d{9}$/;

export const phoneField = z
  .string()
  .regex(phoneRegex, "Enter valid 10-digit number");

export const emailField = z
  .string()
  .email("Invalid email address")
  .or(z.literal(""));

export const addressSchema = z.object({
  address: z.string(),
  pincode: z.string(),
  district: z.string(),
  state: z.string(),
  geo: z.string().optional(),
  policeStation: z.string().optional(),
});

export const repAddressSchema = z.object({
  address: z.string(),
  pincode: z.string(),
  district: z.string(),
  state: z.string(),
});

export const complainantSchema = z
  .object({
    partyInPerson: z.enum(["yes", "no"]),
    complainantType: z.enum(["Individual", "Entity"]),
    entityType: z.string().optional(),
    entityName: z.string().optional(),
    phone: z.string().regex(phoneRegex, "Enter valid 10-digit number"),
    phoneConfirm: z.string().min(1, "Required"),
    repName: z.string().min(1, "Required"),
    repAge: z.string().min(1, "Required"),
    email: emailField,
    permanentAddresses: z.array(z.object({
      address: z.string(), pincode: z.string(), district: z.string(), state: z.string(), country: z.string(),
    })),
    presentSameAsPermanent: z.enum(["yes", "no"]),
    presentAddresses: z.array(z.object({
      address: z.string(), pincode: z.string(), district: z.string(), state: z.string(), country: z.string(),
    })),
    hasPoA: z.enum(["yes", "no"]),
    poaPhone: z.string().regex(phoneRegex, "Enter valid 10-digit number").or(z.literal("")),
    poaPhoneConfirm: z.string(),
    poaName: z.string(),
    poaAge: z.string(),
    poaEmail: emailField,
    poaPermanentAddresses: z.array(z.object({
      address: z.string(), pincode: z.string(), district: z.string(), state: z.string(), country: z.string(),
    })),
    poaPresentSameAsPermanent: z.enum(["yes", "no"]),
    poaPresentAddresses: z.array(z.object({
      address: z.string(), pincode: z.string(), district: z.string(), state: z.string(), country: z.string(),
    })),
    affidavitText: z.string(),
  })
  .refine((d) => d.phone === d.phoneConfirm, {
    message: "Mobile numbers don't match",
    path: ["phoneConfirm"],
  })
  .refine((d) => d.poaPhone === d.poaPhoneConfirm || !d.poaPhone, {
    message: "Numbers don't match",
    path: ["poaPhoneConfirm"],
  })
  .superRefine((d, ctx) => {
    if (d.hasPoA === "yes") {
      if (!d.poaPhoneConfirm) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["poaPhoneConfirm"], message: "Required" });
      if (!d.poaName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["poaName"], message: "Required" });
      if (!d.poaAge) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["poaAge"], message: "Required" });
    }
  });

export type ComplainantForm = z.infer<typeof complainantSchema>;

/**
 * Validate a single field without triggering cross-field refinements.
 * Returns the error message for `field` if any.
 */
export function validateField(
  data: ComplainantForm,
  field: string,
): string | null {
  // Phone confirm — cross-field check
  if (field === "phoneConfirm") {
    if (!data.phone || !data.phoneConfirm) return null;
    if (data.phone !== data.phoneConfirm) return "Mobile numbers don't match";
    return phoneRegex.test(data.phoneConfirm) ? null : "Enter valid 10-digit number";
  }

  if (field === "poaPhoneConfirm") {
    if (!data.poaPhone && !data.poaPhoneConfirm) return null;
    if (data.poaPhone !== data.poaPhoneConfirm) return "Numbers don't match";
    return phoneRegex.test(data.poaPhoneConfirm) ? null : "Enter valid 10-digit number";
  }

  // Phone regex
  if (field === "phone") {
    if (!data.phone) return null;
    return phoneRegex.test(data.phone) ? null : "Enter valid 10-digit number";
  }
  if (field === "poaPhone") {
    if (!data.poaPhone) return null;
    return phoneRegex.test(data.poaPhone) ? null : "Enter valid 10-digit number";
  }

  // Email
  if (field === "email") {
    if (!data.email) return null;
    return emailField.safeParse(data.email).success ? null : "Invalid email address";
  }
  if (field === "poaEmail") {
    if (!data.poaEmail) return null;
    return emailField.safeParse(data.poaEmail).success ? null : "Invalid email address";
  }

  return null;
}

/**
 * Check if phone pair is matched.
 */
export function isPhoneMatched(
  data: Pick<ComplainantForm, "phone" | "phoneConfirm">,
): boolean {
  return (
    data.phone.length > 0 &&
    data.phoneConfirm.length > 0 &&
    phoneRegex.test(data.phone) &&
    phoneRegex.test(data.phoneConfirm) &&
    data.phone === data.phoneConfirm
  );
}

/**
 * Run full Zod schema validation and return a flat field→message map.
 * Used only by the Next gate — Save as Draft never calls this.
 */
export function validateAllFields(data: unknown): Record<string, string> {
  const result = complainantSchema.safeParse(data);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((e) => [e.path.join("."), e.message])
  );
}