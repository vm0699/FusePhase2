import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import ReligionPicker from "../../components/ReligionPicker";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function ReligionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "religion";
  const [value, setValue] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Religion"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <ReligionPicker value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
