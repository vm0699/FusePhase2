import React from "react";
import FuseTextField from "./FuseTextField";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function CollegeInput({ value, onChange }: Props) {
  return (
    <FuseTextField
      title="College or University"
      subtitle="Where did you study?"
      placeholder="Enter your college or university"
      value={value}
      onChange={onChange}
    />
  );
}
