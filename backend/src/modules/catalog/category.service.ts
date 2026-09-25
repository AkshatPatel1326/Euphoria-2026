import { prisma } from "../../lib/prisma";
import { EventStatus } from "../../../generated/prisma/client";
import { HttpError } from "../../lib/errors";
import type { CategoryWithCount } from "../../types";

export class CategoryService {
  /**
   * Retrieves all festival categories ordered by their number identifier.
   * Includes the count of published events per category.
   */
  public static async getAllCategories(): Promise<CategoryWithCount[]> {
    const categories = await prisma.category.findMany({
      orderBy: {
        number: "asc",
      },
      include: {
        _count: {
          select: {
            events: {
              where: {
                status: EventStatus.PUBLISHED,
              },
            },
          },
        },
      },
    });

    return categories;
  }

  /**
   * Retrieves a single category by its slug, including all its published events.
   */
  public static async getCategoryBySlug(slug: string): Promise<CategoryWithCount> {
    const normalizedSlug = slug.trim().toLowerCase();

    const category = await prisma.category.findUnique({
      where: {
        slug: normalizedSlug,
      },
      include: {
        events: {
          where: {
            status: EventStatus.PUBLISHED,
          },
          orderBy: {
            id: "asc",
          },
        },
        _count: {
          select: {
            events: {
              where: {
                status: EventStatus.PUBLISHED,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new HttpError(`Category '${slug}' not found`, 404);
    }

    return category;
  }
}
