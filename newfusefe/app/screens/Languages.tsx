import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import LanguagesPicker from "../../components/LanguagesPicker";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

export default function LanguagesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" =
    route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "languages";
  const [value, setValue] = useState<string[]>(
    Array.isArray(route.params?.currentValue) ? route.params.currentValue : []
  );

  const handleDone = () => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, value);
    }
    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Languages"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <LanguagesPicker value={value} onChange={setValue} />
    </FuseFieldShell>
  );
}
