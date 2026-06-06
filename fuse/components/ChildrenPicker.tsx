import React from "react";
import FuseOptionList from "./FuseOptionList";

const CHILDREN_OPTIONS = [
  "Don't have children",
  "Have children",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function ChildrenPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Children"
      subtitle="Be clear about where you are in life."
      options={CHILDREN_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
