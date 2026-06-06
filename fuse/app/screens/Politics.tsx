import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import PoliticsPicker from "../../components/PoliticsPicker";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function PoliticsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "politics";
  const [value, setValue] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Politics"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <PoliticsPicker value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
