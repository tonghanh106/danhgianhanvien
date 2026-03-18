import app from "./app";
import { ENV } from "./configs/env.config";

async function startServer() {
  const PORT = ENV.PORT;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} (Supabase Connected via Modular Architecture)`);
  });
}

startServer();
