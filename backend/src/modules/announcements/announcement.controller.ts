import type { Request, Response, NextFunction } from "express";
import { AnnouncementService } from "./announcement.service";
import type { AuthenticatedRequest } from "../../types";
import { HttpError } from "../../lib/errors";

/**
 * Public: Get published announcements
 * GET /api/announcements
 */
export const getPublishedAnnouncementsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const announcements = await AnnouncementService.getPublishedAnnouncements(limit);

    res.status(200).json({
      status: "success",
      count: announcements.length,
      data: {
        announcements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public: Get single published announcement by ID
 * GET /api/announcements/:id
 */
export const getPublishedAnnouncementByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const announcement = await AnnouncementService.getPublishedAnnouncementById(id);

    if (!announcement) {
      throw new HttpError("Announcement not found or not published.", 404);
    }

    res.status(200).json({
      status: "success",
      data: {
        announcement,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all announcements (drafts and published)
 * GET /api/admin/announcements
 */
export const getAdminAnnouncementsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const status = req.query.status as "all" | "published" | "draft" | undefined;

    const announcements = await AnnouncementService.getAllAnnouncements({
      search,
      category,
      status,
    });

    res.status(200).json({
      status: "success",
      count: announcements.length,
      data: {
        announcements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Create an announcement
 * POST /api/admin/announcements
 */
export const createAnnouncementHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, content, category, imageUrl, linkUrl, linkText, isPinned, isPublished } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      throw new HttpError("Title is required.", 400);
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new HttpError("Content is required.", 400);
    }

    const announcement = await AnnouncementService.createAnnouncement({
      title,
      content,
      category,
      imageUrl,
      linkUrl,
      linkText,
      isPinned,
      isPublished,
      authorId: req.user?.id,
    });

    res.status(201).json({
      status: "success",
      message: "Announcement created successfully.",
      data: {
        announcement,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update an announcement
 * PUT /api/admin/announcements/:id
 */
export const updateAnnouncementHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, content, category, imageUrl, linkUrl, linkText, isPinned, isPublished } = req.body;

    if (title !== undefined && (!title || typeof title !== "string" || !title.trim())) {
      throw new HttpError("Title cannot be empty.", 400);
    }

    if (content !== undefined && (!content || typeof content !== "string" || !content.trim())) {
      throw new HttpError("Content cannot be empty.", 400);
    }

    const updated = await AnnouncementService.updateAnnouncement(id, {
      title,
      content,
      category,
      imageUrl,
      linkUrl,
      linkText,
      isPinned,
      isPublished,
    });

    if (!updated) {
      throw new HttpError("Announcement not found.", 404);
    }

    res.status(200).json({
      status: "success",
      message: "Announcement updated successfully.",
      data: {
        announcement: updated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Toggle publish status
 * PATCH /api/admin/announcements/:id/publish
 */
export const togglePublishAnnouncementHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updated = await AnnouncementService.togglePublish(id);

    if (!updated) {
      throw new HttpError("Announcement not found.", 404);
    }

    res.status(200).json({
      status: "success",
      message: `Announcement ${updated.isPublished ? "published" : "unpublished"} successfully.`,
      data: {
        announcement: updated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Toggle pin status
 * PATCH /api/admin/announcements/:id/pin
 */
export const togglePinAnnouncementHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updated = await AnnouncementService.togglePin(id);

    if (!updated) {
      throw new HttpError("Announcement not found.", 404);
    }

    res.status(200).json({
      status: "success",
      message: `Announcement ${updated.isPinned ? "pinned to top" : "unpinned"} successfully.`,
      data: {
        announcement: updated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Delete announcement
 * DELETE /api/admin/announcements/:id
 */
export const deleteAnnouncementHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const deleted = await AnnouncementService.deleteAnnouncement(id);

    if (!deleted) {
      throw new HttpError("Announcement not found.", 404);
    }

    res.status(200).json({
      status: "success",
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
