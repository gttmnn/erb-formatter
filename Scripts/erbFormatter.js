const erbFormatter = (inputText) => {
  const getConfigPath = () => {
    const workspaceConfigPath = nova.workspace.config.get("gttmnn.erb-formatter.executablePath");
    const globalConfigPath = nova.config.get("gttmnn.erb-formatter.executablePath");
    return workspaceConfigPath || globalConfigPath;
  };

  const setUpProcess = (configPath, printWidth, tailwindOutputPath) => {
    const args = ["--stdin", "--print-width", printWidth.toString()];
    const executablePath = nova.path.expanduser(configPath);

    if (tailwindOutputPath !== "") {
      args.push("--tailwind-output-path", tailwindOutputPath);
    }

    return new Process(executablePath, {
      args: args,
      stdio: "pipe",
    });
  };

  const writeToStdin = async (process, inputText) => {
    const writer = process.stdin.getWriter();
    await writer.ready;
    await writer.write(inputText);
    writer.close();
  };

  return new Promise(async (resolve, reject) => {
    const configPath = getConfigPath();

    if (!configPath || configPath.trim() === "") {
      return reject("Please provide an ERB::Formatter executable path in the settings.");
    }

    const printWidth = nova.config.get("gttmnn.erb-formatter.printWidth") || "80";

    const tailwindOutputPath =
      nova.workspace.config.get("gttmnn.erb-formatter.tailwindOutputPath") || "";

    try {
      const process = setUpProcess(configPath, printWidth, tailwindOutputPath);
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

      await writeToStdin(process, inputText);
      process.start();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = erbFormatter;
