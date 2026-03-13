import Component from "../models/Component.js"
import Purchase from "../models/Purchase.js"
import User from "../models/User.js"
import Review from "../models/Review.js"

// @desc    Get comprehensive admin dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
export const getAdminDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    // Platform overview stats
    const [
      totalUsers,
      totalComponents,
      publishedComponents,
      pendingComponents,
      totalPurchases,
      totalReviews,
      activeUsers,
      newUsersThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      Component.countDocuments(),
      Component.countDocuments({ published: true }),
      Component.countDocuments({ status: "pending" }),
      Purchase.countDocuments({ status: "completed" }),
      Review.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ])

    // Revenue and financial stats
    const revenueStats = await Purchase.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          avgOrderValue: { $avg: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ])

    const { totalRevenue = 0, avgOrderValue = 0 } = revenueStats[0] || {}

    // Monthly revenue trend (last 12 months)
    const monthlyRevenue = await Purchase.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    // User growth trend
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ])

    // Top performing categories
    const categoryPerformance = await Component.aggregate([
      { $match: { published: true } },
      {
        $group: {
          _id: "$category",
          componentCount: { $sum: 1 },
          totalDownloads: { $sum: "$downloads" },
          avgRating: { $avg: "$rating" },
          totalRevenue: { $sum: { $multiply: ["$downloads", "$price"] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ])

    // Top sellers by revenue
    const topSellers = await Purchase.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$seller",
          totalRevenue: { $sum: "$amount" },
          totalSales: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ])

    res.status(200).json({
      overview: {
        totalUsers,
        totalComponents,
        publishedComponents,
        pendingComponents,
        totalPurchases,
        totalReviews,
        activeUsers,
        newUsersThisMonth,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      trends: {
        monthlyRevenue: monthlyRevenue.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          revenue: Math.round(item.revenue * 100) / 100,
          transactions: item.transactions,
        })),
        userGrowth: userGrowth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          newUsers: item.newUsers,
        })),
      },
      categoryPerformance: categoryPerformance.map((cat) => ({
        category: cat._id,
        componentCount: cat.componentCount,
        totalDownloads: cat.totalDownloads,
        avgRating: Math.round(cat.avgRating * 10) / 10,
        totalRevenue: Math.round(cat.totalRevenue * 100) / 100,
      })),
      topSellers: topSellers.map((seller) => ({
        id: seller._id,
        name: seller.seller.name,
        email: seller.seller.email,
        avatar: seller.seller.avatar,
        totalRevenue: Math.round(seller.totalRevenue * 100) / 100,
        totalSales: seller.totalSales,
      })),
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all users with filtering and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const page = Number.parseInt(req.query.page, 10) || 1
    const perPage = Number.parseInt(req.query.perPage, 10) || 20
    const startIndex = (page - 1) * perPage
    const role = req.query.role
    const status = req.query.status
    const search = req.query.search

    // Build filter query
    const filter = {}
    if (role && role !== "all") filter.role = role
    if (status === "active") filter.isActive = true
    if (status === "inactive") filter.isActive = false
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    const users = await User.find(filter)
      .select("-password -refreshTokens")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(perPage)

    const total = await User.countDocuments(filter)

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [purchaseCount, componentCount, totalSpent, totalEarned] = await Promise.all([
          Purchase.countDocuments({ buyer: user._id, status: "completed" }),
          Component.countDocuments({ seller: user._id }),
          Purchase.aggregate([
            { $match: { buyer: user._id, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]).then((result) => result[0]?.total || 0),
          Purchase.aggregate([
            { $match: { seller: user._id, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]).then((result) => result[0]?.total || 0),
        ])

        return {
          ...user.toObject(),
          stats: {
            purchaseCount,
            componentCount,
            totalSpent: Math.round(totalSpent * 100) / 100,
            totalEarned: Math.round(totalEarned * 100) / 100,
          },
        }
      }),
    )

    res.status(200).json({
      items: usersWithStats,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
export const updateUserStatus = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const { isActive } = req.body
    const userId = req.params.id

    // Prevent admin from deactivating themselves
    if (userId === req.user.id && !isActive) {
      return res.status(400).json({
        error: {
          message: "Cannot deactivate your own account",
          code: "SELF_DEACTIVATION_NOT_ALLOWED",
        },
      })
    }

    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true, select: "-password -refreshTokens" })

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
          code: "USER_NOT_FOUND",
        },
      })
    }

    res.status(200).json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const { role } = req.body
    const userId = req.params.id

    if (!["buyer", "seller", "admin"].includes(role)) {
      return res.status(400).json({
        error: {
          message: "Invalid role specified",
          code: "INVALID_ROLE",
        },
      })
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true, select: "-password -refreshTokens" })

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
          code: "USER_NOT_FOUND",
        },
      })
    }

    res.status(200).json({
      message: "User role updated successfully",
      user,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all components with admin controls
// @route   GET /api/admin/components
// @access  Private (Admin only)
export const getAllComponents = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const page = Number.parseInt(req.query.page, 10) || 1
    const perPage = Number.parseInt(req.query.perPage, 10) || 20
    const startIndex = (page - 1) * perPage
    const status = req.query.status
    const category = req.query.category
    const search = req.query.search

    // Build filter query
    const filter = {}
    if (status && status !== "all") filter.status = status
    if (category && category !== "all") filter.category = category
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const components = await Component.find(filter)
      .populate("seller", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(perPage)

    const total = await Component.countDocuments(filter)

    // Get sales stats for each component
    const componentsWithStats = await Promise.all(
      components.map(async (component) => {
        const [salesCount, totalRevenue] = await Promise.all([
          Purchase.countDocuments({ component: component._id, status: "completed" }),
          Purchase.aggregate([
            { $match: { component: component._id, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]).then((result) => result[0]?.total || 0),
        ])

        return {
          ...component.toObject(),
          stats: {
            salesCount,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
          },
        }
      }),
    )

    res.status(200).json({
      items: componentsWithStats,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Approve/reject component
// @route   PUT /api/admin/components/:id/status
// @access  Private (Admin only)
export const updateComponentStatus = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const { status, rejectionReason } = req.body
    const componentId = req.params.id

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: {
          message: "Invalid status specified",
          code: "INVALID_STATUS",
        },
      })
    }

    const updateData = { status }
    if (status === "approved") {
      updateData.published = true
    } else if (status === "rejected") {
      updateData.published = false
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason
      }
    }

    const component = await Component.findByIdAndUpdate(componentId, updateData, { new: true }).populate(
      "seller",
      "name email",
    )

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    res.status(200).json({
      message: `Component ${status} successfully`,
      component,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Toggle component featured status
// @route   PUT /api/admin/components/:id/featured
// @access  Private (Admin only)
export const toggleComponentFeatured = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const componentId = req.params.id
    const component = await Component.findById(componentId)

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    component.featured = !component.featured
    await component.save()

    res.status(200).json({
      message: `Component ${component.featured ? "featured" : "unfeatured"} successfully`,
      component,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all reviews with moderation controls
// @route   GET /api/admin/reviews
// @access  Private (Admin only)
export const getAllReviews = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const page = Number.parseInt(req.query.page, 10) || 1
    const perPage = Number.parseInt(req.query.perPage, 10) || 20
    const startIndex = (page - 1) * perPage
    const status = req.query.status

    const filter = {}
    if (status === "approved") filter.isApproved = true
    if (status === "pending") filter.isApproved = false

    const reviews = await Review.find(filter)
      .populate("user", "name email avatar")
      .populate("component", "title")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(perPage)

    const total = await Review.countDocuments(filter)

    res.status(200).json({
      items: reviews,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Approve/reject review
// @route   PUT /api/admin/reviews/:id/status
// @access  Private (Admin only)
export const updateReviewStatus = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const { isApproved } = req.body
    const reviewId = req.params.id

    const review = await Review.findByIdAndUpdate(reviewId, { isApproved }, { new: true }).populate("component")

    if (!review) {
      return res.status(404).json({
        error: {
          message: "Review not found",
          code: "REVIEW_NOT_FOUND",
        },
      })
    }

    // Update component rating
    if (review.component) {
      await review.component.updateRating()
    }

    res.status(200).json({
      message: `Review ${isApproved ? "approved" : "rejected"} successfully`,
      review,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get platform statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin only)
export const getPlatformStatistics = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    // User statistics by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
        },
      },
    ])

    // Component statistics by category and status
    const componentStats = await Component.aggregate([
      {
        $group: {
          _id: {
            category: "$category",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
    ])

    // Revenue by month (last 6 months)
    const revenueByMonth = await Purchase.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    // Top categories by revenue
    const topCategories = await Purchase.aggregate([
      { $match: { status: "completed" } },
      {
        $lookup: {
          from: "components",
          localField: "component",
          foreignField: "_id",
          as: "component",
        },
      },
      { $unwind: "$component" },
      {
        $group: {
          _id: "$component.category",
          revenue: { $sum: "$amount" },
          sales: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ])

    res.status(200).json({
      userStats: userStats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          active: stat.active,
        }
        return acc
      }, {}),
      componentStats: componentStats.reduce((acc, stat) => {
        if (!acc[stat._id.category]) {
          acc[stat._id.category] = {}
        }
        acc[stat._id.category][stat._id.status] = stat.count
        return acc
      }, {}),
      revenueByMonth: revenueByMonth.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        revenue: Math.round(item.revenue * 100) / 100,
        transactions: item.transactions,
      })),
      topCategories: topCategories.map((cat) => ({
        category: cat._id,
        revenue: Math.round(cat.revenue * 100) / 100,
        sales: cat.sales,
      })),
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const userId = req.params.id

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        error: {
          message: "Cannot delete your own account",
          code: "SELF_DELETION_NOT_ALLOWED",
        },
      })
    }

    // Soft delete by deactivating
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        email: `deleted_${Date.now()}_temp_email`, // Prevent email conflicts
      },
      { new: true, select: "-password -refreshTokens" },
    )

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
          code: "USER_NOT_FOUND",
        },
      })
    }

    res.status(200).json({
      message: "User deleted successfully",
      user,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get recent activity feed
// @route   GET /api/admin/activity
// @access  Private (Admin only)
export const getRecentActivity = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const limit = Number.parseInt(req.query.limit, 10) || 50

    // Get recent purchases
    const recentPurchases = await Purchase.find({ status: "completed" })
      .populate("component", "title")
      .populate("buyer", "name")
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .limit(limit / 3)

    // Get recent component submissions
    const recentComponents = await Component.find()
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .limit(limit / 3)

    // Get recent user registrations
    const recentUsers = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(limit / 3)

    // Combine and sort all activities
    const activities = [
      ...recentPurchases.map((purchase) => ({
        type: "purchase",
        id: purchase._id,
        title: `${purchase.buyer.name} purchased ${purchase.component.title}`,
        subtitle: `$${purchase.amount} from ${purchase.seller.name}`,
        timestamp: purchase.createdAt,
        data: purchase,
      })),
      ...recentComponents.map((component) => ({
        type: "component",
        id: component._id,
        title: `New component: ${component.title}`,
        subtitle: `By ${component.seller.name} - ${component.status}`,
        timestamp: component.createdAt,
        data: component,
      })),
      ...recentUsers.map((user) => ({
        type: "user",
        id: user._id,
        title: `New user registered: ${user.name}`,
        subtitle: `Role: ${user.role}`,
        timestamp: user.createdAt,
        data: user,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)

    res.status(200).json({
      activities,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete component permanently
// @route   DELETE /api/admin/components/:id
// @access  Private (Admin only)
export const deleteComponent = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const componentId = req.params.id

    // Check if component exists
    const component = await Component.findById(componentId)
    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    // Delete related purchases and reviews
    await Promise.all([Purchase.deleteMany({ component: componentId }), Review.deleteMany({ component: componentId })])

    // Delete the component
    await Component.findByIdAndDelete(componentId)

    res.status(200).json({
      message: "Component and related data deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Suspend user account
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (Admin only)
export const suspendUser = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const userId = req.params.id

    // Prevent admin from suspending themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        error: {
          message: "Cannot suspend your own account",
          code: "SELF_SUSPENSION_NOT_ALLOWED",
        },
      })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, status: "suspended" },
      { new: true, select: "-password -refreshTokens" },
    )

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
          code: "USER_NOT_FOUND",
        },
      })
    }

    res.status(200).json({
      message: "User suspended successfully",
      user,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Activate user account
// @route   PUT /api/admin/users/:id/activate
// @access  Private (Admin only)
export const activateUser = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const userId = req.params.id

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true, status: "active" },
      { new: true, select: "-password -refreshTokens" },
    )

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
          code: "USER_NOT_FOUND",
        },
      })
    }

    res.status(200).json({
      message: "User activated successfully",
      user,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Approve component
// @route   PUT /api/admin/components/:id/approve
// @access  Private (Admin only)
export const approveComponent = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const componentId = req.params.id

    const component = await Component.findByIdAndUpdate(
      componentId,
      { status: "approved", published: true },
      { new: true },
    ).populate("seller", "name email")

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    res.status(200).json({
      message: "Component approved successfully",
      component,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Reject component
// @route   PUT /api/admin/components/:id/reject
// @access  Private (Admin only)
export const rejectComponent = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const componentId = req.params.id
    const { rejectionReason } = req.body

    const component = await Component.findByIdAndUpdate(
      componentId,
      {
        status: "rejected",
        published: false,
        rejectionReason: rejectionReason || "Component does not meet platform standards",
      },
      { new: true },
    ).populate("seller", "name email")

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      })
    }

    res.status(200).json({
      message: "Component rejected successfully",
      component,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all purchases with admin controls
// @route   GET /api/admin/purchases
// @access  Private (Admin only)
export const getAllPurchases = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        },
      })
    }

    const page = Number.parseInt(req.query.page, 10) || 1
    const perPage = Number.parseInt(req.query.perPage, 10) || 20
    const startIndex = (page - 1) * perPage
    const status = req.query.status

    const filter = {}
    if (status && status !== "all") filter.status = status

    const purchases = await Purchase.find(filter)
      .populate("buyer", "name email avatar")
      .populate("seller", "name email avatar")
      .populate("component", "title price category")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(perPage)

    const total = await Purchase.countDocuments(filter)

    res.status(200).json({
      items: purchases,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    next(error)
  }
}
