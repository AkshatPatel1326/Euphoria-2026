import { Router } from "express";
import {
  getAllCategoriesHandler,
  getCategoryBySlugHandler,
} from "./category.controller";

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all festival categories with event counts
 * @access  Public
 */
router.get("/", getAllCategoriesHandler);

/**
 * @route   GET /api/categories/:slug
 * @desc    Get single category with all its published events
 * @access  Public
 */
router.get("/:slug", getCategoryBySlugHandler);

export default router;
