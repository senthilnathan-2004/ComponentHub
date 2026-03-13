import Component from "../models/Component.js"
import Purchase from "../models/Purchase.js"
import User from "../models/User.js"
import mongoose from "mongoose"

// @desc    Get seller statistics
// @route   GET /api/dashboard/seller/:id/stats
// @access  Private (Owner/Admin)
export const getSellerStats = async (req, res, next) => {
  try {
    const sellerId = req.params.id

    // Check if user can access this seller's stats
    if (req.user.id !== sellerId && req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Not authorized to view these statistics",
          code: "FORBIDDEN",
        },
      })
    }

    // Get total revenue
    const revenueStats = await Purchase.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalSales: { $sum: 1 },
        },
      },
    ])

    const { totalRevenue = 0, totalSales = 0 } = revenueStats[0] || {}

    // Get average rating
    const ratingStats = await Component.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          published: true,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalComponents: { $sum: 1 },
          totalDownloads: { $sum: "$downloads" },
        },
      },
    ])

    const { avgRating = 0, totalComponents = 0, totalDownloads = 0 } = ratingStats[0] || {}

    // Get recent sales
    const recentSales = await Purchase.find({
      seller: sellerId,
      status: "completed",
    })
      .populate("component", "title")
      .populate("buyer", "name")
      .sort({ createdAt: -1 })
      .limit(10)

    // Get monthly revenue data for chart
    const monthlyRevenue = await Purchase.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
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
          sales: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Get top performing components
    const topComponents = await Component.find({
      seller: sellerId,
      published: true,
    })
      .sort({ downloads: -1 })
      .limit(5)
      .select("title downloads rating price")

    res.status(200).json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales,
      avgRating: Math.round(avgRating * 10) / 10,
      totalComponents,
      totalDownloads,
      recentSales: recentSales.map((sale) => ({
        componentName: sale.component.title,
        buyerName: sale.buyer.name,
        amount: sale.amount,
        date: sale.createdAt,
      })),
      monthlyRevenue: monthlyRevenue.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        revenue: item.revenue,
        sales: item.sales,
      })),
      topComponents: topComponents.map((comp) => ({
        id: comp._id,
        title: comp.title,
        downloads: comp.downloads,
        rating: comp.rating,
        price: comp.price,
      })),
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get user purchase history
// @route   GET /api/dashboard/user/:id/purchases
// @access  Private (Owner/Admin)
export const getUserPurchases = async (req, res, next) => {
  try {
    const userId = req.params.id

    // Check if user can access this data
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Not authorized to view this data",
          code: "FORBIDDEN",
        },
      })
    }

    const page = Number.parseInt(req.query.page, 10) || 1
    const perPage = Number.parseInt(req.query.perPage, 10) || 10
    const startIndex = (page - 1) * perPage

    const purchases = await Purchase.find({ buyer: userId })
      .populate("component", "title screenshots category")
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(perPage)

    const total = await Purchase.countDocuments({ buyer: userId })

    res.status(200).json({
      items: purchases.map((purchase) => ({
        id: purchase._id,
        component: {
          id: purchase.component._id,
          title: purchase.component.title,
          category: purchase.component.category,
          screenshot: purchase.component.screenshots[0],
        },
        seller: {
          name: purchase.seller.name,
        },
        amount: purchase.amount,
        status: purchase.status,
        transactionId: purchase.transactionId,
        downloadUrl: purchase.downloadUrl,
        downloadCount: purchase.downloadCount,
        maxDownloads: purchase.maxDownloads,
        purchaseDate: purchase.createdAt,
        expiresAt: purchase.expiresAt,
      })),
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

// @desc    Get user favorite components
// @route   GET /api/dashboard/user/:id/favorites
// @access  Private (Owner/Admin)
export const getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.params.id

    // Check if user can access this data
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Not authorized to view this data",
          code: "FORBIDDEN",
        },
      })
    }

    // For now, return empty array as we haven't implemented favorites tracking
    // In a real app, you'd have a Favorites model or user.favorites array
    res.status(200).json({
      items: [],
      meta: {
        total: 0,
        page: 1,
        perPage: 10,
        totalPages: 0,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get admin analytics
// @route   GET /api/dashboard/admin/analytics
// @access  Private (Admin only)
export const getAdminAnalytics = async (req, res, next) => {
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
    const totalUsers = await User.countDocuments()
    const totalComponents = await Component.countDocuments()
    const publishedComponents = await Component.countDocuments({ published: true })
    const totalPurchases = await Purchase.countDocuments({ status: "completed" })

    // Revenue stats
    const revenueStats = await Purchase.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          avgOrderValue: { $avg: "$amount" },
        },
      },
    ])

    const { totalRevenue = 0, avgOrderValue = 0 } = revenueStats[0] || {}

    // User growth over time
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
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $limit: 12,
      },
    ])

    // Top sellers
    const topSellers = await Purchase.aggregate([
      {
        $match: { status: "completed" },
      },
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
      {
        $unwind: "$seller",
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
    ])

    // Category performance
    const categoryStats = await Component.aggregate([
      {
        $match: { published: true },
      },
      {
        $group: {
          _id: "$category",
          componentCount: { $sum: 1 },
          totalDownloads: { $sum: "$downloads" },
          avgRating: { $avg: "$rating" },
        },
      },
      {
        $sort: { componentCount: -1 },
      },
    ])

    // Recent activity
    const recentPurchases = await Purchase.find({ status: "completed" })
      .populate("component", "title")
      .populate("buyer", "name")
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .limit(10)

    const recentComponents = await Component.find({ published: true })
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .limit(10)

    res.status(200).json({
      overview: {
        totalUsers,
        totalComponents,
        publishedComponents,
        totalPurchases,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      userGrowth: userGrowth.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        newUsers: item.newUsers,
      })),
      topSellers: topSellers.map((seller) => ({
        id: seller._id,
        name: seller.seller.name,
        email: seller.seller.email,
        totalRevenue: seller.totalRevenue,
        totalSales: seller.totalSales,
      })),
      categoryStats: categoryStats.map((cat) => ({
        category: cat._id,
        componentCount: cat.componentCount,
        totalDownloads: cat.totalDownloads,
        avgRating: Math.round(cat.avgRating * 10) / 10,
      })),
      recentActivity: {
        purchases: recentPurchases.map((purchase) => ({
          id: purchase._id,
          componentTitle: purchase.component.title,
          buyerName: purchase.buyer.name,
          sellerName: purchase.seller.name,
          amount: purchase.amount,
          date: purchase.createdAt,
        })),
        components: recentComponents.map((comp) => ({
          id: comp._id,
          title: comp.title,
          category: comp.category,
          sellerName: comp.seller.name,
          publishedAt: comp.createdAt,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get seller's component performance
// @route   GET /api/dashboard/seller/:id/components
// @access  Private (Owner/Admin)
export const getSellerComponents = async (req, res, next) => {
  try {
    const sellerId = req.params.id

    // Check if user can access this data
    if (req.user.id !== sellerId && req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Not authorized to view this data",
          code: "FORBIDDEN",
        },
      })
    }

    const page = Number.parseInt(req.query.page, 10) || 1
    const perPage = Number.parseInt(req.query.perPage, 10) || 10
    const startIndex = (page - 1) * perPage

    const components = await Component.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(perPage)

    const total = await Component.countDocuments({ seller: sellerId })

    // Get sales data for each component
    const componentsWithSales = await Promise.all(
      components.map(async (component) => {
        const salesCount = await Purchase.countDocuments({
          component: component._id,
          status: "completed",
        })

        const revenue = await Purchase.aggregate([
          {
            $match: {
              component: component._id,
              status: "completed",
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$amount" },
            },
          },
        ])

        return {
          id: component._id,
          title: component.title,
          category: component.category,
          price: component.price,
          published: component.published,
          status: component.status,
          downloads: component.downloads,
          rating: component.rating,
          reviewCount: component.reviewCount,
          salesCount,
          revenue: revenue[0]?.totalRevenue || 0,
          createdAt: component.createdAt,
          updatedAt: component.updatedAt,
        }
      }),
    )

    res.status(200).json({
      items: componentsWithSales,
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

// @desc    Get user dashboard overview
// @route   GET /api/dashboard/user/:id/overview
// @access  Private (Owner/Admin)
export const getUserOverview = async (req, res, next) => {
  try {
    const userId = req.params.id

    // Check if user can access this data
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          message: "Not authorized to view this data",
          code: "FORBIDDEN",
        },
      })
    }

    // Get purchase stats
    const purchaseStats = await Purchase.aggregate([
      {
        $match: {
          buyer: new mongoose.Types.ObjectId(userId),
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
          totalPurchases: { $sum: 1 },
        },
      },
    ])

    const { totalSpent = 0, totalPurchases = 0 } = purchaseStats[0] || {}

    // Get recent purchases
    const recentPurchases = await Purchase.find({
      buyer: userId,
      status: "completed",
    })
      .populate("component", "title screenshots")
      .sort({ createdAt: -1 })
      .limit(5)

    // Get favorite categories (based on purchases)
    const favoriteCategories = await Purchase.aggregate([
      {
        $match: {
          buyer: new mongoose.Types.ObjectId(userId),
          status: "completed",
        },
      },
      {
        $lookup: {
          from: "components",
          localField: "component",
          foreignField: "_id",
          as: "component",
        },
      },
      {
        $unwind: "$component",
      },
      {
        $group: {
          _id: "$component.category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 3,
      },
    ])

    res.status(200).json({
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalPurchases,
      recentPurchases: recentPurchases.map((purchase) => ({
        id: purchase._id,
        componentTitle: purchase.component.title,
        componentScreenshot: purchase.component.screenshots[0],
        amount: purchase.amount,
        purchaseDate: purchase.createdAt,
      })),
      favoriteCategories: favoriteCategories.map((cat) => ({
        category: cat._id,
        purchaseCount: cat.count,
      })),
    })
  } catch (error) {
    next(error)
  }
}
