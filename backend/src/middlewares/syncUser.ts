import type { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { getAuth } from '@clerk/express'

const prisma = new PrismaClient()

export const syncUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If the request isn't authenticated yet or doesn't have a userId, skip sync.
    // The requireAuth() middleware later down the chain will reject unauthorized requests.
    const { userId } = getAuth(req)
    
    if (userId) {
      // Lazy sync: check if user exists
      let user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // User doesn't exist, create them in our DB with their Clerk ID
        // Also create a default trading account so they can start right away.
        user = await prisma.user.create({
          data: {
            id: userId,
            // You can optionally fetch emails from Clerk backend using clerkClient, 
            // but for paper trading keeping it simple is often fine.
            tradingAccounts: {
              create: {
                name: 'Default Paper Account',
                balance: 100000,
                currency: 'USD'
              }
            }
          }
        })
        console.log(`[SyncUser] Created new user & default account for Clerk ID: ${userId}`)
      }
    }
  } catch (error) {
    console.error('[SyncUser] Failed to sync user:', error)
  }

  next()
}
