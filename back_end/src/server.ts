import app from "./app";
import { ENV } from "./configs/env.config";
import { scheduleDailyStarJob, runDailyStarJob } from "./cron/dailyStars";

async function startServer() {
  const PORT = ENV.PORT;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Chạy ngay khi khởi động (tạo sao hôm nay nếu chưa có)
  await runDailyStarJob();
  // Lên lịch chạy hàng ngày lúc 00:05
  scheduleDailyStarJob();
}

startServer();
