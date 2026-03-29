import React from "react";
import FuseOptionList from "./FuseOptionList";

const PETS_OPTIONS = [
  "None",
  "Cat",
  "Dog",
  "Cat and Dog",
  "Other",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function PetsPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Pets"
      subtitle="Let people know if pets are part of your world."
      options={PETS_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
