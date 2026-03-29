import React from "react";
import FuseOptionList from "./FuseOptionList";

const DRINKING_OPTIONS = [
  "Yes",
  "No",
  "Sometimes",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function DrinkingPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Drinking"
      subtitle="Set expectations around your lifestyle."
      options={DRINKING_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
