import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSwagger } from "./swagger";
import { validateOrThrow } from "./env-validator";

// Valida variáveis de ambiente antes de iniciar o servidor
validateOrThrow();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir arquivos estáticos para favicon e assets da documentação
app.use('/static', express.static('server/public'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);
  
  // Setup API Documentation
  setupSwagger(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Azure Linux espera que o servidor escute em process.env.PORT ou 8080
  const port = parseInt(process.env.PORT || '8080', 10);
  server.listen(port, () => {
    log(`http://localhost:${port}`);
    
    // Mostrar links da documentação em modo desenvolvimento
    if (app.get("env") === "development") {
      console.log('\n Documentação da API MatchSkills:');
      console.log(`  Scalar Docs: http://localhost:${port}/docs`);
      console.log('');
    }
  });
})();
