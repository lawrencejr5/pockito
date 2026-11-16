import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "update exchange rates",
  { hourUTC: 0, minuteUTC: 5 },
  internal.currencies.syncRates,
);

export default crons;

