import React from "react";
import FuseOptionList from "./FuseOptionList";

const ZODIAC_OPTIONS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function ZodiacPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Zodiac Sign"
      subtitle="Add this if astrology is part of your vibe."
      options={ZODIAC_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
