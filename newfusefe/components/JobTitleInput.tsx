import React from "react";
import FuseTextField from "./FuseTextField";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function JobTitleInput({ value, onChange }: Props) {
  return (
    <FuseTextField
      title="Job Title"
      subtitle="What's your current role?"
      placeholder="Enter your job title"
      value={value}
      onChange={onChange}
    />
  );
}
