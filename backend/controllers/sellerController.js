
import mongoose from "mongoose"
import User from "../models/User.js"
import Component from "../models/Component.js"
import Review from "../models/Review.js"  
export const getSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select("-password")
    if (!seller) return res.status(404).json({ message: "Seller not found" })

    // count components by seller
    const componentsCount = await Component.countDocuments({ seller: seller._id })

    // get component ids for this seller
    const compDocs = await Component.find({ seller: seller._id }).select("_id")
    const compIds = compDocs.map(c => c._id)

    // count reviews across those components
    const reviewsCount = compIds.length
      ? await Review.countDocuments({ component: { $in: compIds } })
      : 0

    // compute average rating (optional)
    let avgRating = 0
    if (compIds.length) {
      const agg = await Review.aggregate([
        { $match: { component: { $in: compIds.map(id => new mongoose.Types.ObjectId(id)) } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } }
      ])
      avgRating = agg.length ? Number(agg[0].avgRating.toFixed(2)) : 0
    }

    res.json({
      id: seller._id,
      name: seller.name,
      email: seller.email,
      role: seller.role,
      bio: seller.bio,
      website: seller.website,
      location: seller.location,
      stats: {
        components: componentsCount || 0,
        sales: 0,        
        reviews: reviewsCount || 0,
        avgRating
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}
