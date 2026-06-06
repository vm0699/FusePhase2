import React from "react";
import FuseOptionList from "./FuseOptionList";

const politicsOptions = [
  "Liberal",
  "Conservative",
  "Moderate",
  "Apathetic",
  "Other",
  "Prefer not to say",
];

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function PoliticsPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Politics"
      subtitle="How would you describe your political views?"
      options={politicsOptions}
      value={value}
      onChange={onChange}
    />
  );
}
