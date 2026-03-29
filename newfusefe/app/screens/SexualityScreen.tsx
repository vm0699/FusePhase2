import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import SexualityPicker from "../../components/SexualityPicker";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function SexualityScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "sexuality";
  const initialValue = route.params?.currentValue ?? "";
  const [value, setValue] = useState<string>(initialValue);

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Sexuality"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <SexualityPicker value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
