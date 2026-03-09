import AuditLog from '../models/AuditLog.js';

// ── GET /api/audit-log ───────────────────────────────────────────────────────
// Query with filters: ?action=job_created&resource=job&userId=xxx&limit=50&page=1

export const getAuditLogs = async (req, res) => {
  try {
    const { action, resource, userId, limit = 50, page = 1, from, to } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/audit-log/stats ─────────────────────────────────────────────────
// Summary: actions by type, most active users, recent activity count

export const getAuditStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const [byAction, byUser, byDay, total] = await Promise.all([
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { userId: '$userId', name: '$userName', email: '$userEmail' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      AuditLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    res.json({
      success: true,
      data: {
        totalThisWeek: total,
        byAction: byAction.map(a => ({ action: a._id, count: a.count })),
        byUser: byUser.map(u => ({ name: u._id.name, email: u._id.email, count: u.count })),
        byDay: byDay.map(d => ({ date: d._id, count: d.count }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/audit-log/resource/:resource/:id ────────────────────────────────
// History for a specific resource (e.g., all actions on a specific job)

export const getResourceHistory = async (req, res) => {
  try {
    const { resource, id } = req.params;

    const logs = await AuditLog.find({ resource, resourceId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};