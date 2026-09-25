import { prisma } from "../../lib/prisma";
import type { ScheduleWithEvent } from "../../types";

export class ScheduleService {
  /**
   * Retrieves all confirmed schedule entries with linked event previews.
   */
  public static async getAllSchedules(): Promise<ScheduleWithEvent[]> {
    const schedules = await prisma.schedule.findMany({
      include: {
        event: {
          select: {
            id: true,
            slug: true,
            name: true,
            categoryId: true,
            venue: true,
            time: true,
          },
        },
      },
      orderBy: [
        { date: "asc" },
        { createdAt: "asc" },
      ],
    });

    return schedules as ScheduleWithEvent[];
  }
}
