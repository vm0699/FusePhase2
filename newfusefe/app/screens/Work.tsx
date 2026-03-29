import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import WorkInput from "../../components/WorkInput";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function WorkScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "work";
  const [value, setValue] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Work"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <WorkInput value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
