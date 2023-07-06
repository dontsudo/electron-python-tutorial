import { app, BrowserWindow } from "electron";
import { spawn, execFile } from "child_process";
import { join } from "path";
import { URL } from "url";

const env = import.meta.env;

let server = null;

const createServer = async () => {
  const executable =
    env.MODE === "development"
      ? join(__dirname, "../../pylib/main.py")
      : join(__dirname, "../../pylib/dist/main");

  const command = process.platform === "win32" ? "python" : "python3";

  console.log(`🍜 ${command} ${executable}`);

  server =
    env.MODE === "development"
      ? spawn(command, [executable])
      : execFile(executable);

  return new Promise((resolve, reject) => {
    server.stdout.once("data", (data) => {
      resolve();
    });

    server.stderr.once("data", (data) => {
      reject(`Server error: ${data}`);
    });

    server.on("close", (code) => {
      reject(`Server closed with code ${code}`);
    });
  });
};

const closeServer = () => {
  server.kill();
};

app.on("will-quit", closeServer);

/** @type {BrowserWindow | null} */
let mainWindow = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, "../../preload/dist/index.cjs"),
      contextIsolation: env.MODE !== "test", // Spectron tests can't work with contextIsolation: true
      enableRemoteModule: env.MODE === "test", // Spectron tests can't work with enableRemoteModule: false
    },
  });

  const pageUrl =
    env.MODE === "development"
      ? env.VITE_DEV_SERVER_URL
      : new URL(
          "../renderer/dist/index.html",
          "file://" + __dirname
        ).toString();

  await mainWindow.loadURL(pageUrl);
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app
  .whenReady()
  .then(createServer)
  .then(createWindow)
  .catch((e) => console.error("Failed create window:", e));
