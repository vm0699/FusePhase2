import React from "react";
import FuseOptionList from "./FuseOptionList";

const ETHNICITY_OPTIONS = [
  "Asian",
  "Black",
  "Latino / Hispanic",
  "Middle Eastern",
  "Native American",
  "Pacific Islander",
  "South Asian",
  "White",
  "Mixed",
  "Other",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function EthnicityPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Ethnicity"
      subtitle="Share this if it feels important to your identity."
      options={ETHNICITY_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
