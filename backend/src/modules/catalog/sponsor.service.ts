import { prisma } from "../../lib/prisma";
import type { Sponsor, Prisma } from "../../../generated/prisma/client";

export class SponsorService {
  /**
   * Retrieves all festival sponsors sorted with featured sponsors first,
   * then by display order ascending.
   */
  public static async getAllSponsors(featuredOnly = false): Promise<Sponsor[]> {
    const where: Prisma.SponsorWhereInput = {};

    if (featuredOnly) {
      where.isFeatured = true;
    }

    const sponsors = await prisma.sponsor.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" },
        { order: "asc" },
      ],
    });

    return sponsors;
  }
}
