import React from "react";
import FuseOptionList from "./FuseOptionList";

const SMOKING_OPTIONS = [
  "Yes",
  "No",
  "Sometimes",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function SmokingPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Smoking"
      subtitle="Set expectations around your habits."
      options={SMOKING_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
