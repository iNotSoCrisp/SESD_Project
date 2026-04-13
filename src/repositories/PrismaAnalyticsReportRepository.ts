import type {
  AnalyticsReportRecord,
  IAnalyticsReportRepository,
} from './interfaces/IAnalyticsReportRepository';
import { prisma } from './prisma';

export class PrismaAnalyticsReportRepository implements IAnalyticsReportRepository {
  async markAllAsStaleByUserId(userId: string): Promise<number> {
    const result = await prisma.analyticsReport.updateMany({
      where: { userId },
      data: { isStale: true },
    });

    return result.count;
  }

  async findByUserAndType(userId: string, reportType: string): Promise<AnalyticsReportRecord | null> {
    const record = await prisma.analyticsReport.findUnique({
      where: {
        userId_reportType: {
          userId,
          reportType,
        },
      },
    });

    if (record === null) {
      return null;
    }

    return this.toRecord(record);
  }

  async upsert(
    userId: string,
    reportType: string,
    data: Record<string, unknown>,
    isStale: boolean,
  ): Promise<AnalyticsReportRecord> {
    const record = await prisma.analyticsReport.upsert({
      where: {
        userId_reportType: {
          userId,
          reportType,
        },
      },
      update: {
        data: data as import('@prisma/client').Prisma.InputJsonValue,
        isStale,
        generatedAt: new Date(),
      },
      create: {
        userId,
        reportType,
        data: data as import('@prisma/client').Prisma.InputJsonValue,
        isStale,
      },
    });

    return this.toRecord(record);
  }

  private toRecord(record: {
    id: string;
    userId: string;
    reportType: string;
    data: import('@prisma/client').Prisma.JsonValue;
    isStale: boolean;
    generatedAt: Date;
  }): AnalyticsReportRecord {
    return {
      id: record.id,
      userId: record.userId,
      reportType: record.reportType,
      data: record.data as Record<string, unknown>,
      isStale: record.isStale,
      generatedAt: record.generatedAt,
    };
  }
}
