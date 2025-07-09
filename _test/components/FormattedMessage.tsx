//@ts-nocheck

const App = () => {
  return (
    <div>
      <FormattedMessage
        namespace={`jsxNamespace`}
        string={`formatted string with a dot`}
        messageKey={`formattedMessageKey`}
      />
      ,
    </div>
  );
};
