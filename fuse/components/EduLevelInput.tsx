import React from "react";
import FuseTextField from "./FuseTextField";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function EduLevelInput({ value, onChange }: Props) {
  return (
    <FuseTextField
      title="Education Level"
      subtitle="What's your highest level of education?"
      placeholder="Enter your education level"
      value={value}
      onChange={onChange}
    />
  );
}
