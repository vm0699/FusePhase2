import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import ZodiacPicker from "../../components/ZodiacPicker";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function ZodiacSignScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "zodiacSign";
  const [value, setValue] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Zodiac Sign"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <ZodiacPicker value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
