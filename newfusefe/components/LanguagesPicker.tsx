import React from "react";
import FuseOptionList from "./FuseOptionList";

const languageOptions = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Other",
];

interface Props {
  value: string[];
  onChange: (val: string[]) => void;
}

export default function LanguagesPicker({ value = [], onChange }: Props) {
  return (
    <FuseOptionList
      title="Languages Spoken"
      subtitle="Select every language you can comfortably speak."
      options={languageOptions}
      value={value}
      onChange={onChange}
      multiple
    />
  );
}
