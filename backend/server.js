import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ENV } from "./config/env.js";


const server = http.createServer(app);

const start = async () => {
  await connectDB();


  server.listen(ENV.PORT, () => {
    console.log(`Server is running on port http://localhost:${ENV.PORT}`)
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});


