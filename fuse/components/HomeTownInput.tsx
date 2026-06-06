import React from "react";
import FuseTextField from "./FuseTextField";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function HomeTownInput({ value, onChange }: Props) {
  return (
    <FuseTextField
      title="Home Town"
      subtitle="Where are you originally from?"
      placeholder="Enter your home town"
      value={value}
      onChange={onChange}
    />
  );
}
