import { validationResult } from "express-validator"
import Report from "../models/Report.js"
import Component from "../models/Component.js"
import User from "../models/User.js"

const AUTO_FLAG_THRESHOLD = Number(process.env.REPORT_AUTO_FLAG_THRESHOLD) || 3 // configurable

export const createReport = async (req, res, next) => {
  try {
    // express-validator errors (if used in route)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { component: componentId, reason, description, name, email, isAnonymous } = req.body

    // Validate component exists
    const component = await Component.findById(componentId)
    if (!component) {
      return res.status(404).json({ error: { message: "Component not found", code: "COMPONENT_NOT_FOUND" } })
    }

    const reportData = {
      component: componentId,
      reason,
      description,
      reporter: req.user?.id,
      reporterName: isAnonymous ? undefined : name || req.user?.name,
      reporterEmail: isAnonymous ? undefined : email || req.user?.email,
      isAnonymous: !!isAnonymous,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      attachments: (req.files || []).map((f) => ({
        filename: f.filename || f.originalname,
        originalName: f.originalname,
        filePath: f.path,
        fileSize: f.size,
        mimeType: f.mimetype,
      })),
    }

    const report = await Report.create(reportData)

    // Increment a report counter on the component (non-breaking if field doesn't exist)
    const comp = await Component.findByIdAndUpdate(
      componentId,
      { $inc: { reportCount: 1 } },
      { new: true, useFindAndModify: false },
    )

    // Auto-flag if threshold reached
    if (comp && comp.reportCount >= AUTO_FLAG_THRESHOLD && comp.status !== "pending") {
      comp.status = "pending"
      await comp.save()
      // optional: notify admins (see notifyAdmin snippet later)
    }

    // Optionally: send email to component owner/admin (not included here)
    return res.status(201).json({ message: "Report submitted", report })
  } catch (error) {
    next(error)
  }
}

export const getReports = async (req, res, next) => {
  try {
    // admin only (ensure requireAdmin used in routes)
    const page = Number.parseInt(req.query.page, 10) || 1
    const perPage = Math.min(Number.parseInt(req.query.perPage, 10) || 20, 200)
    const startIndex = (page - 1) * perPage

    const filter = {}
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status
    if (req.query.component) filter.component = req.query.component
    if (req.query.search) {
      // basic search in description or reporterName/email
      const s = req.query.search
      filter.$or = [{ description: { $regex: s, $options: "i" } }, { reporterName: { $regex: s, $options: "i" } }]
    }

    const [items, total] = await Promise.all([
      Report.find(filter)
        .populate({
          path: "component",
          select: "title seller",
          populate: {
            path: "seller",
            select: "name email",
          },
        })
        .populate("reporter", "name email")
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(perPage)
        .lean(),
      Report.countDocuments(filter),
    ])

    res.status(200).json({
      items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    })
  } catch (error) {
    next(error)
  }
}

export const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate({
        path: "component",
        select: "title description seller",
        populate: {
          path: "seller",
          select: "name email",
        },
      })
      .populate("reporter", "name email")
      .lean()

    if (!report) {
      return res.status(404).json({ error: { message: "Report not found", code: "REPORT_NOT_FOUND" } })
    }
    res.json({ report })
  } catch (error) {
    next(error)
  }
}

export const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, actionOnComponent } = req.body
    if (!["open", "under_review", "resolved", "dismissed", "pending"].includes(status)) {
      return res.status(400).json({ error: { message: "Invalid status", code: "INVALID_STATUS" } })
    }

    const update = { status, adminNotes, handledBy: req.user.id }
    if (status === "resolved") update.resolvedAt = new Date()

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate({
        path: "component",
        populate: {
          path: "seller",
          select: "name email",
        },
      })
      .populate("reporter", "name email")

    if (!report) {
      return res.status(404).json({ error: { message: "Report not found", code: "REPORT_NOT_FOUND" } })
    }

    // Optional action on component (careful: only do actions your business supports)
    if (actionOnComponent && report.component) {
      if (actionOnComponent === "reject_component") {
        await Component.findByIdAndUpdate(report.component._id, { status: "rejected", published: false })
      } else if (actionOnComponent === "suspend_seller") {
        await User.findByIdAndUpdate(report.component.seller, { isActive: false, status: "suspended" })
      }
    }

    res.json({ message: "Report updated", report })
  } catch (error) {
    next(error)
  }
}

export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id)
    if (!report) return res.status(404).json({ error: { message: "Report not found", code: "REPORT_NOT_FOUND" } })
    await Component.findByIdAndUpdate(report.component, { $inc: { reportCount: -1 } })
    res.json({ message: "Report deleted" })
  } catch (error) {
    next(error)
  }
}
