const erbFormatter = require("./erbFormatter");

exports.activate = async function() {
  if (nova.inDevMode()) {
    console.clear()
    console.log('ERB::Formatter extension activated')
  }

  const displayError = (message) => {
    console.error(message);

    const request = new NotificationRequest();
    request.body = message;
    nova.notifications.add(request).catch((err) => console.error(err, err.stack));
  };

  const replaceDocument = (editor, text) => {
    const documentSpan = new Range(0, editor.document.length);
    editor.edit((edit) => {
      edit.replace(documentSpan, text);
    });
  };

  const formatDocument = (editor) => {
    const documentSpan = new Range(0, editor.document.length);
    const documentText = editor.document.getTextInRange(documentSpan);
    return erbFormatter(documentText)
      .then((formattedText) => replaceDocument(editor, formattedText))
      .catch(displayError);
  };

  const shouldFormatOnSave = (nova) => {
    const workspaceFormatOnSave = nova.workspace.config.get("com.gttmnn.erb-formatter.formatOnSave", "string");
    const globalFormatOnSave = nova.config.get("com.gttmnn.erb-formatter.formatOnSave", "boolean");

    if (workspaceFormatOnSave === "global") return globalFormatOnSave;
    if (workspaceFormatOnSave === "enabled") return true;
    if (workspaceFormatOnSave === "disabled") return false;

    return false;
  };

  nova.workspace.onDidAddTextEditor((editor) => {
    if (editor.document.syntax != "html+erb") return;

    editor.onWillSave((editor) => {
      if (shouldFormatOnSave(nova)) {
        return formatDocument(editor);
      }
    });
  });

  nova.commands.register("erb-formatter.format", formatDocument);
}

exports.deactivate = () => {};
