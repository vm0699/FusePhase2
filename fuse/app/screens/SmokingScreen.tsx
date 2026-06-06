import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import SmokingPicker from "../../components/SmokingPicker";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function SmokingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "smoking";
  const [value, setValue] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Smoking"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <SmokingPicker value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
