import { logger } from "../../server/utils/logger";

export class DateUtils {
  private static formatter() {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Toronto",
      timeZoneName: "short",
    });
  }

  static convertDate(date: Date | string, timeZone = "America/Toronto") {
    const parsed = date instanceof Date ? date : new Date(date);

    if (isNaN(parsed.getTime())) {
      logger.warn({ date }, "Invalid date input");
      return "";
    }

    try {
      const parts = DateUtils.formatter().formatToParts(parsed);

      const get = (type: string) =>
        parts.find((p) => p.type === type)?.value ?? "";

      const day = get("day");
      const month = get("month");
      const year = get("year");
      const hour = get("hour");
      const minute = get("minute");
      const tz = get("timeZoneName");

      return `${day} ${month} ${year} at ${hour}:${minute} ${tz}`;
    } catch (err) {
      logger.error({ err, date, timeZone }, "Date formatting failed");
      return "";
    }
  }
}
