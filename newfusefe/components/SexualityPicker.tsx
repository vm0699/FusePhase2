import React from "react";
import FuseOptionList from "./FuseOptionList";

const OPTIONS = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Queer",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function SexualityPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Sexuality"
      subtitle="Choose the label that feels right for how you identify."
      options={OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
