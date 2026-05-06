import mssql from "mssql"
import mysql from "mysql2/promise"
import type { Pool } from "mysql2/promise"

import { env } from "./env"

class DatabaseManager {
  private static mesPool: Pool | null = null
  private static issPool: Pool | null = null
  private static erpPool: mssql.ConnectionPool | null = null

  static getMesPool(): Pool {
    if (!this.mesPool) {
      this.mesPool = mysql.createPool({
        uri: env.MES_DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
      })
    }
    return this.mesPool
  }

  static getIssPool(): Pool {
    if (!this.issPool) {
      this.issPool = mysql.createPool({
        uri: process.env.ISS_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
      })
    }
    return this.issPool
  }

  // Fixed: Must be async because mssql.connect returns a Promise
  static async getERPPool(): Promise<mssql.ConnectionPool> {
    if (!this.erpPool || !this.erpPool.connected) {
      const config: mssql.config = {
        user: env.ERP_USERNAME,
        password: env.ERP_PASSWORD,
        database: env.ERP_DATABASE,
        server: env.ERP_SERVER,
        port: env.ERP_PORT,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }
      // We use 'new' and 'connect()' for better singleton management
      this.erpPool = await new mssql.ConnectionPool(config).connect()
    }
    return this.erpPool
  }
}

// Export the "getter" functions rather than the initialized objects
// This ensures connections are only made when needed and handle the async nature of MSSQL
export const mes = DatabaseManager.getMesPool()
export const iss = DatabaseManager.getIssPool()
export const erp = DatabaseManager.getERPPool()

const db = { mes, iss, erp }
export default db
