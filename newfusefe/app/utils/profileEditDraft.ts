type ProfileEditDraft = {
  fieldKey: string;
  value: unknown;
};

let pendingDraft: ProfileEditDraft | null = null;

export function setProfileEditDraft(fieldKey: string, value: unknown) {
  pendingDraft = { fieldKey, value };
}

export function consumeProfileEditDraft(): ProfileEditDraft | null {
  const nextDraft = pendingDraft;
  pendingDraft = null;
  return nextDraft;
}
