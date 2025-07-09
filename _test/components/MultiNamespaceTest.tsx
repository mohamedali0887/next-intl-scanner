//@ts-nocheck
"use client";

import * as React from "react";
import { useTranslations } from "@/hooks/use-translations";
import FormattedMessage from "./FormattedMessage";

const MultiNamespaceTest = () => {
  // Multiple useTranslations with different namespaces
  const t = useTranslations("interview");
  const commonT = useTranslations("common");
  const adminT = useTranslations("AdminInterviews");

  return (
    <div className="w-full">
      {/* Interview namespace translations */}
      <h1>{t("title", {}, "Interview Title")}</h1>
      <p>{t("description", {}, "Interview Description")}</p>

      {/* Common namespace translations */}
      <button>{commonT("submit", {}, "Submit")}</button>
      <span>{commonT("cancel", {}, "Cancel")}</span>

      {/* Admin namespace translations */}
      <div>{adminT("admin-panel", {}, "Admin Panel")}</div>
      <span>{adminT("settings", {}, "Settings")}</span>

      {/* FormattedMessage with different namespace */}
      <FormattedMessage
        namespace="common"
        string="select-status"
        messageKey="select-status"
      />
      <FormattedMessage namespace="common" string="all" messageKey="all" />

      {/* Another FormattedMessage with different namespace */}
      <FormattedMessage
        namespace="validation"
        string="Required Field"
        messageKey="required-field"
      />
    </div>
  );
};

export default MultiNamespaceTest;
