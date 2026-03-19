import { pgPool } from "../inits/postgres";

const DEFAULT_DAILY_STARS = 3;

/**
 * Mỗi nhân viên đang làm việc sẽ được tự động nhận 3 sao mỗi ngày.
 * Chạy lúc 00:05 mỗi ngày (tính theo giờ server UTC+7).
 * Dùng INSERT ON CONFLICT DO NOTHING để không ghi đè nếu đã có đánh giá trong ngày.
 */
export async function runDailyStarJob() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  console.log(`[CronJob] Bắt đầu tạo ${DEFAULT_DAILY_STARS} sao mặc định cho ngày ${today}...`);

  try {
    // Lấy tất cả nhân viên đang làm việc
    const { rows: employees } = await pgPool.query(`
      SELECT id FROM employees
      WHERE is_active = true
        AND is_resigned = false
        AND created_at::date <= $1
    `, [today]);

    if (employees.length === 0) {
      console.log(`[CronJob] Không có nhân viên nào đang làm việc.`);
      return;
    }

    // Tạo sao mặc định cho từng nhân viên (bỏ qua nếu đã có đánh giá hôm nay)
    let created = 0;
    let skipped = 0;
    for (const emp of employees) {
      const result = await pgPool.query(`
        INSERT INTO evaluations (employee_id, date, stars, note)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (employee_id, date) DO NOTHING
      `, [emp.id, today, DEFAULT_DAILY_STARS, 'Điểm chuyên cần hàng ngày (tự động)']);

      if ((result.rowCount ?? 0) > 0) created++;
      else skipped++;
    }

    console.log(`[CronJob] Hoàn thành: đã tạo ${created} bản ghi, bỏ qua ${skipped} (đã có đánh giá).`);
  } catch (err) {
    console.error('[CronJob] Lỗi khi tạo sao hàng ngày:', err);
  }
}

/**
 * Lên lịch chạy job hàng ngày lúc 00:05 giờ local (UTC+7).
 * Tính milliseconds đến lần chạy tiếp theo.
 */
export function scheduleDailyStarJob() {
  const scheduleNext = () => {
    const now = new Date();
    // Thời gian chạy tiếp theo: 00:05 ngày hôm sau (UTC+7 = UTC+25200s)
    const nextRun = new Date(now);
    nextRun.setUTCHours(17, 5, 0, 0); // 00:05 UTC+7 = 17:05 UTC ngày hôm trước
    if (nextRun <= now) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    const hoursUntil = Math.round(delay / 3600000 * 10) / 10;
    console.log(`[CronJob] Đã lên lịch tạo sao hàng ngày - chạy sau ${hoursUntil} giờ (lúc ${nextRun.toISOString()})`);

    setTimeout(async () => {
      await runDailyStarJob();
      scheduleNext(); // đặt lại lịch cho ngày tiếp theo
    }, delay);
  };

  scheduleNext();
}
