const erbFormatter = (inputText) => {
  const setUpProcess = (reject) => {
    const workspaceConfigPath = nova.workspace.config.get("com.gttmnn.erb-formatter.executablePath");
    const globalConfigPath = nova.config.get("com.gttmnn.erb-formatter.executablePath");
    const configPath = workspaceConfigPath || globalConfigPath;

    if (configPath.trim() === "") {
      const message = "Please provide a ERB::Formatter executable in Project Settings to enable formatting.";

      reject(message);
    }

    const printWidth = nova.config.get("com.gttmnn.erb-formatter.printWidth");
    const executablePath = nova.path.expanduser(configPath);

    return new Process(executablePath, {
      args: ["--stdin", "--print-width", printWidth.toString()],
      stdio: "pipe",
    });
  };

  const writeToStdin = (process, inputText) => {
    const writer = process.stdin.getWriter();
    writer.ready.then(() => {
      writer.write(inputText);
      writer.close();
    });
  };

  const collectOutputText = (stdout, buffer) => (buffer.stdout += stdout);
  const collectErrorText = (stderr, buffer) => (buffer.stderr += stderr);

  return new Promise((resolve, reject) => {
    try {
      const process = setUpProcess(reject);
      let buffer = { stdout: "", stderr: "" };

      process.onStdout((stdout) => collectOutputText(stdout, buffer));
      process.onStderr((stderr) => collectErrorText(stderr, buffer));
      process.onDidExit((status) => {
        if (status === 0) {
          resolve(buffer.stdout);
        } else {
          reject(buffer.stderr);
        }
      });

      writeToStdin(process, inputText);

      process.start();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = erbFormatter;
