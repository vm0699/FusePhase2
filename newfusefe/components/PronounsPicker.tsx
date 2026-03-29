import React from "react";
import FuseOptionList from "./FuseOptionList";

const PRONOUN_OPTIONS = [
  "she/her",
  "he/him",
  "they/them",
  "Prefer not to say",
];

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function PronounsPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Pronouns"
      subtitle="This helps other people address you the right way."
      options={PRONOUN_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
