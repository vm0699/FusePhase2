import React from "react";
import FuseOptionList from "./FuseOptionList";

const religionOptions = [
  "Hindu",
  "Christian",
  "Muslim",
  "Jain",
  "Sikh",
  "Buddhist",
  "Atheist",
  "Spiritual",
  "Other",
];

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function ReligionPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Religion"
      subtitle="What best describes your beliefs?"
      options={religionOptions}
      value={value}
      onChange={onChange}
    />
  );
}
