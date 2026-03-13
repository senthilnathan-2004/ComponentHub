import { body, param, query, validationResult } from "express-validator"

export const validateRegister = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("role").optional().isIn(["buyer", "seller"]).withMessage("Role must be either buyer or seller"),
  handleValidationErrors,
]

export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]

export const validateComponent = [
  body("title").trim().isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("tags").isArray({ min: 1 }).withMessage("At least one tag is required"),
  body("license")
    .optional()
    .isIn(["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "Custom"])
    .withMessage("Invalid license type"),
  handleValidationErrors,
]

export const validatePurchase = [
  body("componentId").isMongoId().withMessage("Invalid component ID"),
  body("paymentMethod").isIn(["card", "paypal"]).withMessage("Payment method must be card or paypal"),
  body("paymentIntentId").optional().isString().withMessage("Payment intent ID must be a string"),
  handleValidationErrors,
]

export const validateReview = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").trim().isLength({ min: 10, max: 500 }).withMessage("Comment must be between 10 and 500 characters"),
  handleValidationErrors,
]

export const validateComponentUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("category")
    .optional()
    .isIn([
      "UI Components",
      "Layout Components",
      "Form Components",
      "Navigation",
      "Data Display",
      "Feedback",
      "Utilities",
      "Templates",
      "Other",
    ])
    .withMessage("Invalid category"),
  body("tags").optional().isArray({ min: 1 }).withMessage("At least one tag is required"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Each tag must be between 1 and 20 characters"),
  handleValidationErrors,
]

export const validateMongoId = [param("id").isMongoId().withMessage("Invalid ID format"), handleValidationErrors]

export const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("perPage").optional().isInt({ min: 1, max: 100 }).withMessage("Per page must be between 1 and 100"),
  handleValidationErrors,
]

export const validateSearch = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),
  query("category")
    .optional()
    .isIn([
      "UI Components",
      "Layout Components",
      "Form Components",
      "Navigation",
      "Data Display",
      "Feedback",
      "Utilities",
      "Templates",
      "Other",
    ])
    .withMessage("Invalid category"),
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("Minimum price must be a positive number"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("Maximum price must be a positive number"),
  query("sort")
    .optional()
    .isIn(["price-asc", "price-desc", "rating", "downloads", "newest"])
    .withMessage("Invalid sort option"),
  handleValidationErrors,
]

export const validatePaymentMethod = [
  body("type").isIn(["card", "paypal"]).withMessage("Payment method type must be card or paypal"),
  body("stripePaymentMethodId")
    .if(body("type").equals("card"))
    .notEmpty()
    .withMessage("Stripe payment method ID is required for card payments"),
  body("paypalEmail")
    .if(body("type").equals("paypal"))
    .isEmail()
    .withMessage("Valid PayPal email is required for PayPal payments"),
  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
  handleValidationErrors,
]

export const validatePasswordReset = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  handleValidationErrors,
]

export const validatePasswordUpdate = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Password confirmation does not match")
    }
    return true
  }),
  handleValidationErrors,
]

export const validateProfileUpdate = [
  body("name").optional().trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
  handleValidationErrors,
]

// Custom validation for business logic
export const validateComponentOwnership = async (req, res, next) => {
  try {
    const Component = (await import("../models/Component.js")).default
    const component = await Component.findById(req.params.id)

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    if (component.seller.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Not authorized to modify this component",
          code: "FORBIDDEN",
        },
      })
    }

    req.component = component
    next()
  } catch (error) {
    next(error)
  }
}

export const validatePurchaseEligibility = async (req, res, next) => {
  try {
    const Component = (await import("../models/Component.js")).default
    const Purchase = (await import("../models/Purchase.js")).default

    const component = await Component.findById(req.body.componentId)

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    if (!component.published) {
      return res.status(400).json({
        error: {
          message: "Component is not available for purchase",
          code: "COMPONENT_NOT_PUBLISHED",
        },
      })
    }

    // Check if user is trying to buy their own component
    if (component.seller.toString() === req.user.id) {
      return res.status(400).json({
        error: {
          message: "You cannot purchase your own component",
          code: "CANNOT_PURCHASE_OWN_COMPONENT",
        },
      })
    }

    // Check if user already purchased this component
    const existingPurchase = await Purchase.findOne({
      component: req.body.componentId,
      buyer: req.user.id,
      status: "completed",
    })

    if (existingPurchase) {
      return res.status(400).json({
        error: {
          message: "You have already purchased this component",
          code: "ALREADY_PURCHASED",
        },
      })
    }

    req.component = component
    next()
  } catch (error) {
    next(error)
  }
}

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors.array(),
      },
    })
  }
  next()
}
