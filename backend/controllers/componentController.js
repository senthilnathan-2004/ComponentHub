import Component from "../models/Component.js";
import Review from "../models/Review.js";

// @desc    Get all components
// @route   GET /api/components
// @access  Public
export const getComponents = async (req, res, next) => {
  try {
    const query = {};

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Published filter
    if (req.query.published !== undefined) {
      query.published = req.query.published === "true";
    } else {
      query.published = true; // Default to published only
    }

    // Seller filter
    if (req.query.seller) {
      query.seller = req.query.seller;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice)
        query.price.$gte = Number.parseFloat(req.query.minPrice);
      if (req.query.maxPrice)
        query.price.$lte = Number.parseFloat(req.query.maxPrice);
    }

    // Tags filter
    if (req.query.tags) {
      const tags = req.query.tags.split(",");
      query.tags = { $in: tags };
    }

    // Pagination
    const page = Number.parseInt(req.query.page, 10) || 1;
    const perPage = Number.parseInt(req.query.perPage, 10) || 12;
    const startIndex = (page - 1) * perPage;

    // Sorting
    let sort = {};
    switch (req.query.sort) {
      case "price-asc":
        sort = { price: 1 };
        break;
      case "price-desc":
        sort = { price: -1 };
        break;
      case "rating":
        sort = { rating: -1 };
        break;
      case "downloads":
        sort = { downloads: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Execute query
    const components = await Component.find(query)
      .populate("seller", "name avatar")
      .sort(sort)
      .skip(startIndex)
      .limit(perPage);

    // Get total count for pagination
    const total = await Component.countDocuments(query);
    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      items: components.map((component) => ({
        id: component._id,
        title: component.title,
        description: component.description,
        price: component.price,
        category: component.category,
        tags: component.tags,
        seller: component.seller
          ? {
              id: component.seller._id,
              name: component.seller.name,
              avatar: component.seller.avatar,
              rating: 4.8,
              totalSales: 156,
            }
          : null, //avoid crash
        screenshots: component.screenshots,
        downloads: component.downloads,
        stars: component.stars,
        rating: component.rating,
        reviewCount: component.reviewCount,
        published: component.published,
        demoEnabled: component.demoEnabled,
        createdAt: component.createdAt,
        updatedAt: component.updatedAt,
      })),
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single component
// @route   GET /api/components/:id
// @access  Public
export const getComponent = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id).populate(
      "seller",
      "name avatar"
    );

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    // Increment downloads if user is authenticated and not the seller
    if (req.user && req.user.id !== component.seller._id.toString()) {
      component.downloads += 1;
      await component.save();
    }

    res.status(200).json({
      id: component._id,
      title: component.title,
      description: component.description,
      price: component.price,
      category: component.category,
      tags: component.tags,
      seller: component.seller
        ? {
            id: component.seller._id,
            name: component.seller.name,
          }
        : null,
      screenshots: component.screenshots,
      previewSnippet: component.previewSnippet,
      files: component.files.map((file) => ({
        name: file.originalName,
        size: `${(file.fileSize / 1024).toFixed(1)} KB`,
        type: file.fileType,
      })),
      versions: component.versions,
      license: component.license,
      downloads: component.downloads,
      stars: component.stars,
      rating: component.rating,
      reviewCount: component.reviewCount,
      published: component.published,
      demoEnabled: component.demoEnabled,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new component
// @route   POST /api/components
// @access  Private (Seller/Admin)
export const createComponent = async (req, res, next) => {
  try {
    // Add seller to req.body
    req.body.seller = req.user.id;

    // Optional: whitelist allowed fields to avoid malicious extras
    const allowedFields = [
      "title",
      "description",
      "price",
      "category",
      "tags",
      "license",
      "previewSnippet",
      "screenshots",
    ];

    const payload = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        payload[f] = req.body[f];
      }
    });

    payload.seller = req.user.id;


    const component = await Component.create(payload);

    res.status(201).json({
      componentId: component._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update component
// @route   PUT /api/components/:id
// @access  Private (Owner/Admin)
export const updateComponent = async (req, res, next) => {
  try {
    let component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    // Owner / admin check
    if (
      component.seller.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        error: {
          message: "Not authorized to update this component",
          code: "FORBIDDEN",
        },
      });
    }

    // Whitelist update fields
    const allowedUpdates = [
      "title",
      "description",
      "price",
      "category",
      "tags",
      "license",
      "previewSnippet",
      "screenshots",
      "published",
      "status",
      "rejectionReason",
    ];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }


    component = await Component.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Component updated successfully",
      component,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete component
// @route   DELETE /api/components/:id
// @access  Private (Owner/Admin)
export const deleteComponent = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    // Make sure user is component owner or admin
    if (
      component.seller.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        error: {
          message: "Not authorized to delete this component",
          code: "FORBIDDEN",
        },
      });
    }

    await component.deleteOne();

    res.status(200).json({
      message: "Component deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish/unpublish component
// @route   PUT /api/components/:id/publish
// @access  Private (Owner/Admin)
export const togglePublish = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    // Make sure user is component owner or admin
    if (
      component.seller.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        error: {
          message: "Not authorized to publish this component",
          code: "FORBIDDEN",
        },
      });
    }

    component.published = !component.published;
    await component.save();

    res.status(200).json({
      message: `Component ${
        component.published ? "published" : "unpublished"
      } successfully`,
      published: component.published,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Star/unstar component
// @route   POST /api/components/:id/star
// @access  Private
export const toggleStar = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    // For simplicity, we'll just increment/decrement stars
    // In a real app, you'd track which users starred which components
    const action = req.body.action; // 'star' or 'unstar'

    if (action === "star") {
      component.stars += 1;
    } else if (action === "unstar") {
      component.stars = Math.max(0, component.stars - 1);
    }

    await component.save();

    res.status(200).json({
      message: `Component ${action}red successfully`,
      stars: component.stars,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get component reviews
// @route   GET /api/components/:id/reviews
// @access  Public
export const getComponentReviews = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const perPage = 10;
    const startIndex = (page - 1) * perPage;

    const reviews = await Review.find({
      component: req.params.id,
      isApproved: true,
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(perPage);

    const total = await Review.countDocuments({
      component: req.params.id,
      isApproved: true,
    });

    res.status(200).json({
      items: reviews.map((review) => ({
        id: review._id,
        user: {
          name: review.user.name,
          avatar: review.user.avatar,
        },
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt,
      })),
      meta: {
        total,
        page,
        perPage: perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add component review
// @route   POST /api/components/:id/reviews
// @access  Private
export const addComponentReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    // Check if user already reviewed this component
    const existingReview = await Review.findOne({
      component: req.params.id,
      user: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({
        error: {
          message: "You have already reviewed this component",
          code: "REVIEW_EXISTS",
        },
      });
    }

    const review = await Review.create({
      component: req.params.id,
      user: req.user.id,
      rating,
      comment,
      isApproved: true,
    });

    res.status(201).json({
      message: "Review added successfully",
      reviewId: review._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add component review
// @route   POST /api/components/:id/download
// @access  Private
export const handleDownload = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    //Increment downloads count
    component.downloads = (component.downloads || 0) + 1;
    await component.save();

  } catch (error) {
    next(error)
  }
};

// @desc    Get component demo
// @route   GET /api/components/:id/demo
// @access  Public
export const getComponentDemo = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    if (!component.published) {
      return res.status(403).json({
        error: {
          message: "Component not published",
          code: "COMPONENT_NOT_PUBLISHED",
        },
      });
    }

    if (!component.demoEnabled) {
      return res.status(403).json({
        error: {
          message: "Demo not available for this component",
          code: "DEMO_NOT_ENABLED",
        },
      });
    }

    res.status(200).json({
      demoUrl: `/demo/${req.params.id}/`,
      componentId: component._id,
      title: component.title,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top rated components for dashboard
// @route   GET /api/components/dashboard-top-rated
// @access  Public
export const getDashboardTopRated = async (req, res, next) => {
  try {
    // Get top rated components (published only, sorted by rating descending, limit 10)
    const topRated = await Component.find({ published: true })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(10)
      .select('_id title price rating downloads screenshots slug')
      .lean();

    // Format the response to include only first screenshot and minimal fields
    const components = topRated.map(component => ({
      _id: component._id,
      title: component.title,
      price: component.price,
      averageRating: component.rating || 0,
      downloads: component.downloads || 0,
      screenshots: component.screenshots && component.screenshots.length > 0 
        ? [component.screenshots[0]] 
        : [],
      slug: component.slug || component._id
    }));

    res.status(200).json({ components });
  } catch (error) {
    next(error);
  }
};
