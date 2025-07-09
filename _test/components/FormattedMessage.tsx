//@ts-nocheck

const App = () => {
  return (
    <div>
      <FormattedMessage
        namespace="jsxNamespace"
        string="formatted string with a dot"
        messageKey="formattedMessageKey"
      />
      <FormattedMessage
        namespace="anotherNamespace"
        string="another namespace"
        messageKey="anotherMessageKey"
      />
      <FormattedMessage
        namespace="common"
        string="select-status"
        messageKey="select-status"
      />
      <FormattedMessage namespace="common" string="all" messageKey="all" />
      <FormattedMessage
        namespace="validation"
        string="Required Field"
        messageKey="required-field"
      />
    </div>
  );
};
