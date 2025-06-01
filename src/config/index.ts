import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const server = process.env.DB_SERVER;
const database = process.env.DB_DATABASE;

if (!user || !password || !server || !database) {
  throw new Error('Missing required database environment variables');
}

const dbConfig: sql.config = {
  user,
  password,
  server,
  database,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

export const port = process.env.PORT ? Number(process.env.PORT) : 3000;
export const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
