import React from "react";
import FuseOptionList from "./FuseOptionList";

const DRUG_OPTIONS = [
  "Yes",
  "No",
  "Sometimes",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function DrugsPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Drugs"
      subtitle="Set expectations around your habits."
      options={DRUG_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
