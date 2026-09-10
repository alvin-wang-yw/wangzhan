import { PrismaClient } from '@prisma/client';

// Prisma Client 单例模式 - 避免开发环境下热重载创建多个实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// 开发环境下将实例挂载到全局对象
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
