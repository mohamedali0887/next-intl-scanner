import React from "react";
import { useTranslations } from "next-intl";

export const DeepNestedTest = () => {
  // Test various levels of nesting
  const mainT = useTranslations("ClientOrderPage");
  const paymentT = useTranslations("ClientOrderPage.payment");
  const statusT = useTranslations("ClientOrderPage.status");
  const methodsT = useTranslations("ClientOrderPage.payment.methods");
  const creditT = useTranslations("ClientOrderPage.payment.methods.credit");
  const debitT = useTranslations("ClientOrderPage.payment.methods.debit");

  // Test very deep nesting
  const visaT = useTranslations("ClientOrderPage.payment.methods.credit.visa");
  const mastercardT = useTranslations(
    "ClientOrderPage.payment.methods.credit.mastercard"
  );
  const amexT = useTranslations("ClientOrderPage.payment.methods.credit.amex");

  // Test different namespaces
  const userT = useTranslations("UserProfile");
  const userSettingsT = useTranslations("UserProfile.settings");
  const userSettingsPrivacyT = useTranslations("UserProfile.settings.privacy");

  return (
    <div>
      {/* Main namespace */}
      <h1>{mainT("title")}</h1>
      <p>{mainT("description")}</p>
      <span>{mainT("requestNo")}</span>
      <span>{mainT("orderId")}</span>

      {/* Level 1 nesting */}
      <div>
        <h2>{paymentT("title")}</h2>
        <p>{paymentT("amount")}</p>
        <span>{paymentT("currency")}</span>
      </div>

      <div>
        <h2>{statusT("title")}</h2>
        <span>{statusT("pending")}</span>
        <span>{statusT("completed")}</span>
        <span>{statusT("failed")}</span>
      </div>

      {/* Level 2 nesting */}
      <div>
        <h3>{methodsT("title")}</h3>
        <span>{methodsT("card")}</span>
        <span>{methodsT("bank")}</span>
        <span>{methodsT("wallet")}</span>
      </div>

      {/* Level 3 nesting */}
      <div>
        <h4>{creditT("title")}</h4>
        <span>{creditT("description")}</span>
      </div>

      <div>
        <h4>{debitT("title")}</h4>
        <span>{debitT("description")}</span>
      </div>

      {/* Level 4 nesting */}
      <div>
        <h5>{visaT("title")}</h5>
        <span>{visaT("accepted")}</span>
        <span>{visaT("secure")}</span>
      </div>

      <div>
        <h5>{mastercardT("title")}</h5>
        <span>{mastercardT("accepted")}</span>
        <span>{mastercardT("secure")}</span>
      </div>

      <div>
        <h5>{amexT("title")}</h5>
        <span>{amexT("accepted")}</span>
        <span>{amexT("secure")}</span>
      </div>

      {/* Different namespace with deep nesting */}
      <div>
        <h2>{userT("name")}</h2>
        <p>{userT("email")}</p>
        <span>{userT("phone")}</span>
      </div>

      <div>
        <h3>{userSettingsT("title")}</h3>
        <span>{userSettingsT("notifications")}</span>
        <span>{userSettingsT("language")}</span>
      </div>

      <div>
        <h4>{userSettingsPrivacyT("title")}</h4>
        <span>{userSettingsPrivacyT("dataSharing")}</span>
        <span>{userSettingsPrivacyT("cookies")}</span>
        <span>{userSettingsPrivacyT("gdpr")}</span>
      </div>
    </div>
  );
};
