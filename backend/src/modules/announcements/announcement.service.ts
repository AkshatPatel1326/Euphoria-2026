import { prisma } from "../../lib/prisma";

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  isPinned?: boolean;
  isPublished?: boolean;
  authorId?: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  category?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  isPinned?: boolean;
  isPublished?: boolean;
}

export class AnnouncementService {
  /**
   * Public: Get all published announcements.
   * Sorted pinned first, then newest first.
   */
  public static async getPublishedAnnouncements(limit?: number) {
    return prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      take: limit && limit > 0 ? limit : undefined,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        imageUrl: true,
        linkUrl: true,
        linkText: true,
        isPinned: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Public: Get single published announcement by ID.
   */
  public static async getPublishedAnnouncementById(id: string) {
    return prisma.announcement.findFirst({
      where: {
        id,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        imageUrl: true,
        linkUrl: true,
        linkText: true,
        isPinned: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Admin: Get all announcements (drafts and published).
   */
  public static async getAllAnnouncements(filters?: {
    search?: string;
    category?: string;
    status?: "all" | "published" | "draft";
  }) {
    const where: any = {};

    if (filters?.status === "published") {
      where.isPublished = true;
    } else if (filters?.status === "draft") {
      where.isPublished = false;
    }

    if (filters?.category && filters.category !== "ALL") {
      where.category = filters.category;
    }

    if (filters?.search && filters.search.trim()) {
      where.OR = [
        { title: { contains: filters.search.trim(), mode: "insensitive" } },
        { content: { contains: filters.search.trim(), mode: "insensitive" } },
      ];
    }

    return prisma.announcement.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Admin: Get announcement by ID (regardless of published status).
   */
  public static async getAnnouncementById(id: string) {
    return prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Admin: Create announcement.
   */
  public static async createAnnouncement(data: CreateAnnouncementInput) {
    const isPublished = Boolean(data.isPublished);

    let validAuthorId: string | null = null;
    if (data.authorId) {
      const userExists = await prisma.user.findUnique({
        where: { id: data.authorId },
        select: { id: true },
      });
      if (userExists) {
        validAuthorId = userExists.id;
      }
    }

    return prisma.announcement.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category?.trim() || "GENERAL",
        imageUrl: data.imageUrl?.trim() || null,
        linkUrl: data.linkUrl?.trim() || null,
        linkText: data.linkText?.trim() || null,
        isPinned: Boolean(data.isPinned),
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        authorId: validAuthorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Admin: Update announcement.
   */
  public static async updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.content !== undefined) updatePayload.content = data.content.trim();
    if (data.category !== undefined) updatePayload.category = data.category.trim();
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl ? data.imageUrl.trim() : null;
    if (data.linkUrl !== undefined) updatePayload.linkUrl = data.linkUrl ? data.linkUrl.trim() : null;
    if (data.linkText !== undefined) updatePayload.linkText = data.linkText ? data.linkText.trim() : null;
    if (data.isPinned !== undefined) updatePayload.isPinned = Boolean(data.isPinned);

    if (data.isPublished !== undefined) {
      updatePayload.isPublished = Boolean(data.isPublished);
      if (data.isPublished && !existing.publishedAt) {
        updatePayload.publishedAt = new Date();
      } else if (!data.isPublished) {
        // Keeping publishedAt or null depending on requirements; leaving historical publishedAt or clearing
      }
    }

    return prisma.announcement.update({
      where: { id },
      data: updatePayload,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Admin: Toggle publish status.
   */
  public static async togglePublish(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const nextState = !existing.isPublished;
    return prisma.announcement.update({
      where: { id },
      data: {
        isPublished: nextState,
        publishedAt: nextState ? (existing.publishedAt || new Date()) : existing.publishedAt,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Admin: Toggle pinned status.
   */
  public static async togglePin(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    return prisma.announcement.update({
      where: { id },
      data: {
        isPinned: !existing.isPinned,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Admin: Delete announcement.
   */
  public static async deleteAnnouncement(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return false;
    }

    await prisma.announcement.delete({ where: { id } });
    return true;
  }
}
