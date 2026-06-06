import React from "react";
import FuseOptionList from "./FuseOptionList";

const MARIJUANA_OPTIONS = [
  "Yes",
  "No",
  "Sometimes",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function MarijuanaPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Marijuana"
      subtitle="Set expectations around your habits."
      options={MARIJUANA_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
