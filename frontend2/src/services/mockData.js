// Mock data for demonstration when backend is not available
export const mockAdminData = {
  stats: {
    totalUsers: 1247,
    newUsersThisMonth: 89,
    activeUsers: 892,
    totalComponents: 456,
    pendingComponents: 23,
    publishedComponents: 398,
    totalRevenue: 45670,
    avgOrderValue: 67,
    totalPurchases: 681,
    totalReviews: 234,
  },
  users: [
    {
      _id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      role: "seller",
      isActive: true,
      createdAt: "2024-01-15T10:30:00Z",
      lastActive: "2024-01-20T14:22:00Z",
      stats: {
        componentCount: 12,
        totalEarned: 2340,
      },
    },
    {
      _id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      role: "buyer",
      isActive: true,
      createdAt: "2024-01-10T09:15:00Z",
      lastActive: "2024-01-19T16:45:00Z",
      stats: {
        componentCount: 0,
        totalEarned: 0,
      },
    },
    {
      _id: "3",
      name: "Mike Wilson",
      email: "mike.wilson@example.com",
      role: "seller",
      isActive: false,
      createdAt: "2023-12-20T11:20:00Z",
      lastActive: "2024-01-18T13:30:00Z",
      stats: {
        componentCount: 8,
        totalEarned: 1560,
      },
    },
    {
      _id: "4",
      name: "Emma Davis",
      email: "emma.davis@example.com",
      role: "admin",
      isActive: true,
      createdAt: "2023-11-05T08:45:00Z",
      lastActive: "2024-01-20T12:15:00Z",
      stats: {
        componentCount: 0,
        totalEarned: 0,
      },
    },
  ],
  components: [
    {
      _id: "c1",
      title: "Modern Button Component",
      name: "Modern Button Component",
      category: "UI Components",
      price: 29,
      status: "pending",
      seller: {
        name: "John Smith",
        email: "john.smith@example.com",
      },
      stats: {
        salesCount: 45,
        totalRevenue: 1305,
      },
    },
    {
      _id: "c2",
      title: "Dashboard Template",
      name: "Dashboard Template",
      category: "Templates",
      price: 89,
      status: "approved",
      seller: {
        name: "Mike Wilson",
        email: "mike.wilson@example.com",
      },
      stats: {
        salesCount: 23,
        totalRevenue: 2047,
      },
    },
    {
      _id: "c3",
      title: "Login Form Kit",
      name: "Login Form Kit",
      category: "Form Components",
      price: 39,
      status: "rejected",
      seller: {
        name: "John Smith",
        email: "john.smith@example.com",
      },
      stats: {
        salesCount: 0,
        totalRevenue: 0,
      },
    },
  ],
  reviews: [
    {
      _id: "r1",
      comment: "Excellent component, very well designed and easy to integrate!",
      rating: 5,
      status: "approved",
      user: {
        name: "Sarah Johnson",
      },
      component: {
        name: "Modern Button Component",
      },
    },
    {
      _id: "r2",
      comment: "Good quality but could use better documentation.",
      rating: 4,
      status: "pending",
      user: {
        name: "Emma Davis",
      },
      component: {
        name: "Dashboard Template",
      },
    },
    {
      _id: "r3",
      comment: "This is spam content and inappropriate.",
      rating: 1,
      status: "flagged",
      user: {
        name: "Anonymous User",
      },
      component: {
        name: "Login Form Kit",
      },
    },
  ],
  purchases: [],
}

export const mockReports = [
  {
    _id: "rep1",
    reason: "Copyright Infringement",
    description: "This component appears to be copied from another source without permission.",
    status: "pending",
    createdAt: "2024-01-19T10:30:00Z",
    reporter: {
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
    },
    component: {
      title: "Modern Button Component",
      seller: {
        name: "John Smith",
        email: "john.smith@example.com",
      },
    },
  },
  {
    _id: "rep2",
    reason: "Inappropriate Content",
    description: "User is posting spam reviews on multiple components.",
    status: "investigating",
    createdAt: "2024-01-18T14:22:00Z",
    reporter: {
      name: "Mike Wilson",
      email: "mike.wilson@example.com",
    },
    user: {
      name: "Anonymous User",
      email: "spam@example.com",
    },
  },
  {
    _id: "rep3",
    reason: "Quality Issues",
    description: "Component doesn't work as advertised and has multiple bugs.",
    status: "resolved",
    createdAt: "2024-01-17T09:15:00Z",
    reporter: {
      name: "Emma Davis",
      email: "emma.davis@example.com",
    },
    component: {
      title: "Dashboard Template",
      seller: {
        name: "Mike Wilson",
        email: "mike.wilson@example.com",
      },
    },
  },
]
