import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import EduLevelInput from "../../components/EduLevelInput";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function EduLevelScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "educationLevel";
  const [value, setValue] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Education Level"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <EduLevelInput value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
