import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL

  // If a remote database URL is configured (e.g. Postgres, Neon, Supabase), use it directly
  if (envUrl && !envUrl.includes('/home/z/my-project') && !envUrl.startsWith('file:')) {
    return envUrl
  }

  // Detect serverless environment (Vercel, AWS Lambda) where filesystem is read-only except /tmp
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    (process.env.NODE_ENV === 'production' && !fs.existsSync(path.join(process.cwd(), 'dev.pid')))

  if (isServerless) {
    const tmpDbPath = path.join('/tmp', 'custom.db')
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'custom.db'),
        path.join(process.cwd(), 'db', 'custom.db'),
        path.resolve('./prisma/custom.db'),
        path.resolve('./db/custom.db'),
        path.join(__dirname, '..', '..', 'prisma', 'custom.db'),
        path.join(__dirname, '..', '..', 'db', 'custom.db'),
        path.join(__dirname, 'custom.db'),
      ]

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath)
            break
          } catch (e) {
            console.error(`[db] Failed to copy SQLite db from ${candidate} to /tmp:`, e)
          }
        }
      }
    }

    if (fs.existsSync(tmpDbPath)) {
      return `file:${tmpDbPath}`
    }
  }

  // Local development fallback
  const localCandidates = [
    path.join(process.cwd(), 'prisma', 'custom.db'),
    path.join(process.cwd(), 'db', 'custom.db'),
  ]

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      return `file:${candidate}`
    }
  }

  return 'file:./prisma/custom.db'
}

function createPrismaClient(): PrismaClient {
  const url = getDatabaseUrl()
  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: ['error', 'warn'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db