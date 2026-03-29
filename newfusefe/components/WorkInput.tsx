import React from "react";
import FuseTextField from "./FuseTextField";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function WorkInput({ value, onChange }: Props) {
  return (
    <FuseTextField
      title="Work"
      subtitle="Where do you work?"
      placeholder="Enter your workplace"
      value={value}
      onChange={onChange}
    />
  );
}
