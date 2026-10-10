const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Progress = require('../models/Progress');

const router = express.Router();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const percentageChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const dateBounds = (year, period) => {
  const now = new Date();
  const end = year ? new Date(`${year}-12-31T23:59:59.999Z`) : now;
  let start;

  if (year) {
    start = new Date(`${year}-01-01T00:00:00.000Z`);
  } else {
    const days = Math.min(Math.max(toNumber(period, 30), 1), 3650);
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days + 1);
    start.setUTCHours(0, 0, 0, 0);
  }

  return { start, end };
};

const previousBounds = ({ start, end }) => {
  const duration = end.getTime() - start.getTime() + 1;
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime() - 1),
  };
};

const dateMatch = (field, bounds) => ({
  [field]: { $gte: bounds.start, $lte: bounds.end },
});

const monthlySeries = (items, dateField, valueField, year) => {
  const values = Array(12).fill(0);
  items.forEach(item => {
    const date = item[dateField] || item.paymentDate;
    if (!date) return;
    const parsed = new Date(date);
    if (parsed.getUTCFullYear() === year) {
      values[parsed.getUTCMonth()] += valueField ? Number(item[valueField] || 0) : 1;
    }
  });
  return values;
};

const monthRows = (users, progress, payments, year) => {
  const userCounts = monthlySeries(users, 'createdAt', null, year);
  const enrollmentCounts = monthlySeries(progress, 'createdAt', null, year);
  const revenue = monthlySeries(payments, 'paidDate', 'amount', year);

  return MONTHS.map((month, index) => ({
    month,
    year,
    users: userCounts[index],
    newUsers: userCounts[index],
    courses: enrollmentCounts[index],
    enrollments: enrollmentCounts[index],
    revenue: revenue[index],
  }));
};

const getReport = async ({ year, period }) => {
  const bounds = dateBounds(year, period);
  const previous = previousBounds(bounds);
  const selectedYear = year || bounds.end.getUTCFullYear();

  const [
    totalUsers,
    totalCourses,
    currentUsers,
    previousUsers,
    currentCourses,
    previousCourses,
    currentPayments,
    previousPayments,
    allPayments,
    previousProgress,
    completedProgress,
    allUsers,
    allProgress,
    allCourses,
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    User.countDocuments(dateMatch('createdAt', bounds)),
    User.countDocuments(dateMatch('createdAt', previous)),
    Course.countDocuments(dateMatch('createdAt', bounds)),
    Course.countDocuments(dateMatch('createdAt', previous)),
    Payment.find({ ...dateMatch('paidDate', bounds), status: 'completed' })
      .select('amount paidDate paymentDate').lean(),
    Payment.find({ ...dateMatch('paidDate', previous), status: 'completed' })
      .select('amount paidDate paymentDate').lean(),
    Payment.find({ status: 'completed', ...dateMatch('paidDate', { start: new Date(`${selectedYear}-01-01T00:00:00.000Z`), end: new Date(`${selectedYear}-12-31T23:59:59.999Z`) }) })
      .select('amount paidDate paymentDate').lean(),
    Progress.find(dateMatch('createdAt', previous)).select('createdAt').lean(),
    Progress.find({ isCompleted: true, ...dateMatch('completionDate', bounds) })
      .select('completionDate').lean(),
    User.find().select('createdAt lastLogin').lean(),
    Progress.find().select('createdAt').lean(),
    Course.find()
      .populate('instructor', 'name avatar')
      .select('title price averageRating enrolledStudents instructor')
      .lean(),
  ]);

  const totalRevenue = currentPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const previousRevenue = previousPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const activeSince = new Date(Math.min(bounds.end.getTime(), Date.now()));
  activeSince.setUTCDate(activeSince.getUTCDate() - 1);
  const dailyActiveUsers = allUsers.filter(user => user.lastLogin && new Date(user.lastLogin) >= activeSince).length;
  const currentAverageRating = allCourses.length
    ? allCourses.reduce((sum, course) => sum + (course.averageRating || 0), 0) / allCourses.length
    : 0;
  const topCourses = allCourses
    .sort((a, b) => (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0))
    .slice(0, 5);

  const usersForYear = allUsers.filter(user => user.createdAt);
  const progressForYear = allProgress.filter(item => item.createdAt);

  return {
    overview: {
      totalUsers,
      totalCourses,
      totalRevenue,
      activeUsers: dailyActiveUsers,
      completedCourses: completedProgress.length,
      averageRating: Number(currentAverageRating.toFixed(2)),
      usersGrowth: percentageChange(currentUsers, previousUsers),
      coursesGrowth: percentageChange(currentCourses, previousCourses),
      revenueGrowth: percentageChange(totalRevenue, previousRevenue),
      activeUsersGrowth: 0,
    },
    userActivity: {
      dailyActiveUsers,
      dailyActiveUsersGrowth: 0,
      courseCompletionsThisMonth: completedProgress.length,
      courseCompletionsGrowth: percentageChange(completedProgress.length, previousProgress.length),
      averageRating: Number(currentAverageRating.toFixed(2)),
      averageRatingChange: 0,
    },
    userGrowth: monthRows(usersForYear, progressForYear, allPayments, selectedYear),
    revenueData: monthRows([], [], allPayments, selectedYear).map(row => ({
      month: row.month,
      year: row.year,
      revenue: row.revenue,
    })),
    courseStats: topCourses.map(course => ({
      _id: course._id,
      title: course.title,
      enrolledStudents: course.enrolledStudents || [],
      price: course.price,
      averageRating: course.averageRating || 0,
    })),
    topCourses,
    userEngagement: [],
    monthlyStats: monthRows(usersForYear, progressForYear, allPayments, selectedYear),
  };
};

const csvEscape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

const createPdf = text => {
  const lines = text.split('\r\n').map(line => line.replace(/[()\\]/g, character => `\\${character}`));
  const content = `BT /F1 10 Tf 36 756 Td ${lines.map(line => `(${line}) Tj 0 -14 Td`).join(' ')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'ascii');
};

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const year = req.query.year && req.query.year !== 'all'
      ? toNumber(req.query.year, null)
      : null;
    if (year !== null && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
      return res.status(400).json({ success: false, message: 'Year must be between 2000 and 2100' });
    }

    const analytics = await getReport({ year, period: req.query.period });
    return res.status(200).json({ success: true, analytics });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics data' });
  }
});

router.get('/export', protect, authorize('admin'), async (req, res) => {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();
    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ success: false, message: 'Export format must be csv or pdf' });
    }

    const year = req.query.year && req.query.year !== 'all' ? toNumber(req.query.year, null) : null;
    if (year !== null && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
      return res.status(400).json({ success: false, message: 'Year must be between 2000 and 2100' });
    }
    const analytics = await getReport({ year, period: req.query.period });
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', analytics.overview.totalUsers],
      ['Total Courses', analytics.overview.totalCourses],
      ['Total Revenue (LKR)', analytics.overview.totalRevenue],
      ['Active Users', analytics.overview.activeUsers],
      ...analytics.monthlyStats.map(row => [`${row.month} ${row.year} Users`, row.users]),
    ];
    const csv = rows.map(row => row.map(csvEscape).join(',')).join('\r\n');

    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="analytics-report.csv"',
      });
      return res.send(csv);
    }

    const pdf = createPdf(`Analytics Report\r\n${csv}`);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="analytics-report.pdf"',
    });
    return res.send(pdf);
  } catch (error) {
    console.error('Analytics export error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export analytics report' });
  }
});

module.exports = router;
