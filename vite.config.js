import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import { get } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(frontendDir, "../Backend");

function backendHealthCheck() {
  return new Promise((resolve) => {
    const request = get("http://127.0.0.1:3001/api/db-check", (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.setTimeout(1000, () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

function backendStartupPlugin() {
  let managedBackend;

  return {
    name: "financial-system-backend-startup",
    apply: "serve",
    async configureServer(server) {
      // Starting Vite from an IDE or another terminal must also start the API.
      if (!(await backendHealthCheck())) {
        let backendSpawnError;
        managedBackend = spawn(process.execPath, ["server.js"], {
          cwd: backendDir,
          stdio: "inherit",
          env: process.env,
        });
        managedBackend.on("error", (error) => {
          backendSpawnError = error;
        });

        const deadline = Date.now() + 120_000;
        while (Date.now() < deadline) {
          if (backendSpawnError) {
            throw new Error(`Could not start backend: ${backendSpawnError.message}`);
          }
          if (managedBackend.exitCode !== null) {
            throw new Error("Backend stopped before its database became ready.");
          }
          if (await backendHealthCheck()) {
            console.log("Backend database is ready.");
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (!(await backendHealthCheck())) {
          managedBackend.kill();
          managedBackend = undefined;
          throw new Error("Backend did not become ready within 120 seconds. Check the database settings above.");
        }

        managedBackend.on("error", (error) => {
          server.config.logger.error(`Could not start backend: ${error.message}`);
        });
      }

      server.httpServer?.once("close", () => {
        if (managedBackend && managedBackend.exitCode === null) managedBackend.kill();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), backendStartupPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
