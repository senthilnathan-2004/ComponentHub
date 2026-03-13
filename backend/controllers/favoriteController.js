import Favorite from "../models/Favorite.js";
import Component from "../models/Component.js";

// @desc    Add component to favorites
// @route   POST /api/favorites
// @access  Private (Buyer only)
export const addToFavorites = async (req, res, next) => {
  try {
    const { componentId } = req.body;
    const userId = req.user.id;

    // Check if component exists
    const component = await Component.findById(componentId);
    if (!component) {
      return res.status(404).json({
        success: false,
        message: "Component not found",
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: userId,
      component: componentId,
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: "Component already in favorites",
      });
    }

    // Add to favorites
    const favorite = await Favorite.create({
      user: userId,
      component: componentId,
    });

    res.status(201).json({
      success: true,
      message: "Component added to favorites",
      data: favorite,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Component already in favorites",
      });
    }
    next(error);
  }
};

// @desc    Remove component from favorites
// @route   DELETE /api/favorites/:componentId
// @access  Private (Buyer only)
export const removeFromFavorites = async (req, res, next) => {
  try {
    const { componentId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      component: componentId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Component removed from favorites",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favorite components
// @route   GET /api/favorites
// @access  Private (Buyer only)
export const getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Pagination
    const page = Number.parseInt(req.query.page, 10) || 1;
    const perPage = Number.parseInt(req.query.perPage, 10) || 12;
    const skip = (page - 1) * perPage;

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: "component",
        populate: {
          path: "seller",
          select: "name avatar",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    const total = await Favorite.countDocuments({ user: userId });

    const components = favorites.map((favorite) => favorite.component);

    res.status(200).json({
      success: true,
      items: components,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / perPage),
        perPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if component is in user's favorites
// @route   GET /api/favorites/check/:componentId
// @access  Private (Buyer only)
export const checkFavorite = async (req, res, next) => {
  try {
    const { componentId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({
      user: userId,
      component: componentId,
    });

    res.status(200).json({
      success: true,
      isFavorited: !!favorite,
    });
  } catch (error) {
    next(error);
  }
};
