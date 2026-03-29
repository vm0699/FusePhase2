import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import DrugsPicker from "../../components/DrugsPicker";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function DrugsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "drugs";
  const [value, setValue] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Drugs"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <DrugsPicker value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
