const erbFormatter = (inputText) => {
  const getConfigPath = () => {
    const workspaceConfigPath = nova.workspace.config.get(
      "com.gttmnn.erb-formatter.executablePath"
    );
    const globalConfigPath = nova.config.get(
      "com.gttmnn.erb-formatter.executablePath"
    );
    return workspaceConfigPath || globalConfigPath;
  };

  const setUpProcess = (configPath, printWidth) => {
    const executablePath = nova.path.expanduser(configPath);
    return new Process(executablePath, {
      args: ["--stdin", "--print-width", printWidth.toString()],
      stdio: "pipe",
    });
  };

  const writeToStdin = (process, inputText) => {
    const writer = process.stdin.getWriter();
    return writer.ready.then(() => {
      writer.write(inputText);
      writer.close();
    });
  };

  return new Promise((resolve, reject) => {
    const configPath = getConfigPath();

    if (!configPath || configPath.trim() === "") {
      return reject(
        "Please provide an ERB::Formatter executable path in the project settings."
      );
    }

    const printWidth =
      nova.config.get("com.gttmnn.erb-formatter.printWidth") || "80";

    try {
      const process = setUpProcess(configPath, printWidth);
      const buffer = { stdout: "", stderr: "" };

      process.onStdout((stdout) => (buffer.stdout += stdout));
      process.onStderr((stderr) => (buffer.stderr += stderr));
      process.onDidExit((status) => {
        if (status === 0) {
          resolve(buffer.stdout);
        } else {
          reject(buffer.stderr);
        }
      });

      writeToStdin(process, inputText)
        .then(() => process.start())
        .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = erbFormatter;
