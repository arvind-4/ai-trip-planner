import { SQLDatabase } from "encore.dev/storage/sqldb";

export const tripDB = new SQLDatabase("trip", {
  migrations: "./migrations",
});
