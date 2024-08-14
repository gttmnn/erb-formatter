const erbFormatter = require("./erbFormatter");

exports.activate = async function () {
  if (nova.inDevMode()) {
    console.clear();
    console.log("ERB::Formatter extension activated");
  }

  const displayError = (message) => {
    console.error(message);
    const request = new NotificationRequest();
    request.body = message;
    nova.notifications
      .add(request)
      .catch((err) => console.error(err, err.stack));
  };

  const replaceDocument = (editor, text) => {
    const documentSpan = new Range(0, editor.document.length);
    editor.edit((edit) => {
      edit.replace(documentSpan, text);
    });
  };

  const formatDocument = (editor) => {
    const documentText = editor.document.getTextInRange(
      new Range(0, editor.document.length)
    );
    return erbFormatter(documentText)
      .then((formattedText) => replaceDocument(editor, formattedText))
      .catch(displayError);
  };

  const shouldFormatOnSave = () => {
    const workspaceFormatOnSave = nova.workspace.config.get(
      "com.gttmnn.erb-formatter.formatOnSave",
      "string"
    );
    const globalFormatOnSave = nova.config.get(
      "com.gttmnn.erb-formatter.formatOnSave",
      "boolean"
    );

    switch (workspaceFormatOnSave) {
      case "enabled":
        return true;
      case "disabled":
        return false;
      case "global":
      default:
        return globalFormatOnSave;
    }
  };

  nova.workspace.onDidAddTextEditor((editor) => {
    if (editor.document.syntax !== "html+erb") return;

    editor.onWillSave((editor) => {
      if (shouldFormatOnSave()) {
        return formatDocument(editor);
      }
    });
  });

  nova.commands.register("erb-formatter.format", formatDocument);
};

exports.deactivate = () => {};
