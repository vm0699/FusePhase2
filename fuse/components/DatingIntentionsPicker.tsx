import React from "react";
import FuseOptionList from "./FuseOptionList";

const datingOptions = [
  "Long-term relationship",
  "Short-term relationship",
  "New friends",
  "Open to exploring",
  "Marriage",
  "Not sure yet",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function DatingIntentionsPicker({ value, onChange }: Props) {
  return (
    <FuseOptionList
      title="Dating Intentions"
      subtitle="What are you hoping to find on Fuse right now?"
      options={datingOptions}
      value={value}
      onChange={onChange}
    />
  );
}
