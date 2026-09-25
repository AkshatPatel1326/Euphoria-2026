import type { Request, Response, NextFunction } from "express";
import { CategoryService } from "./category.service";

/**
 * Controller retrieving all categories with their event counts
 * GET /api/categories
 */
export const getAllCategoriesHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await CategoryService.getAllCategories();

    res.status(200).json({
      status: "success",
      count: categories.length,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving a single category with its events by slug
 * GET /api/categories/:slug
 */
export const getCategoryBySlugHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const category = await CategoryService.getCategoryBySlug(slug);

    res.status(200).json({
      status: "success",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};
