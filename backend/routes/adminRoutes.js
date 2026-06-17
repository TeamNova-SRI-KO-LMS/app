const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateCourseCreation,
  handleValidationErrors,
} = require('../middleware/validation');

const router = express.Router();

// Helper function to get rolling monthly statistics (handles year transitions automatically)
async function getRollingMonthlyStatistics(startDate, endDate) {
  try {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get monthly user registrations within date range
    const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get monthly course creations within date range
    const monthlyCourses = await Course.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get monthly revenue from completed payments within date range
    // Use paidDate for revenue grouping so revenue appears when payment was completed, not created
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidDate: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidDate' },
            month: { $month: '$paidDate' }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Create maps for quick lookup
    const userMap = new Map();
    monthlyUsers.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      userMap.set(key, item.count);
    });

    const courseMap = new Map();
    monthlyCourses.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      courseMap.set(key, item.count);
    });

    const revenueMap = new Map();
    monthlyRevenue.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      revenueMap.set(key, item.totalAmount);
    });

    // Build statistics for all months in the date range
    const stats = [];
    const currentDate = new Date(startDate);
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();

    // Iterate through all months in the range
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // 1-based month
      const key = `${year}-${month}`;

      const users = userMap.get(key) || 0;
      const courses = courseMap.get(key) || 0;
      const revenue = revenueMap.get(key) || 0;

      stats.push({
        month: monthNames[month - 1],
        year,
        users,
        courses,
        revenue,
        label: `${monthNames[month - 1].substring(0, 3)} ${year.toString().substring(2)}`, // e.g., "Jan 24"
        date: `${year}-${String(month).padStart(2, '0')}`
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1); // Reset to first day of month to avoid date overflow issues

      // Break if we've passed the end date
      if (currentDate.getFullYear() > endYear ||
          (currentDate.getFullYear() === endYear && currentDate.getMonth() > endMonth)) {
        break;
      }
    }

    return stats;
  } catch (error) {
    console.error('Error getting rolling monthly statistics:', error);
    return [];
  }
}

// Helper function to get monthly statistics for a specific year (kept for backward compatibility)
async function _getMonthlyStatistics(year) {
  try {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get start and end dates for the year
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st

    // Get monthly user registrations
    const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Get monthly course creations
    const monthlyCourses = await Course.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Get monthly revenue from completed payments (use paidDate for accurate revenue timing)
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidDate: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidDate' },
            month: { $month: '$paidDate' }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Create maps for quick lookup
    const userMap = new Map();
    monthlyUsers.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      userMap.set(key, item.count);
    });

    const courseMap = new Map();
    monthlyCourses.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      courseMap.set(key, item.count);
    });

    const revenueMap = new Map();
    monthlyRevenue.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      revenueMap.set(key, item.totalAmount);
    });

    // Build statistics for all 12 months
    const stats = [];
    for (let month = 1; month <= 12; month++) {
      const key = `${year}-${month}`;
      const users = userMap.get(key) || 0;
      const courses = courseMap.get(key) || 0;
      const revenue = revenueMap.get(key) || 0;

      stats.push({
        month: monthNames[month - 1],
        year,
        users,
        courses,
        revenue,
        label: monthNames[month - 1].substring(0, 3) // Short month name for charts
      });
    }

    return stats;
  } catch (error) {
    console.error('Error getting monthly statistics:', error);
    // Return empty stats for all months if there's an error
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames.map((month, _index) => ({
      month,
      year,
      users: 0,
      courses: 0,
      revenue: 0,
      label: month.substring(0, 3)
    }));
  }
}

// @desc    Get payment statistics for admin dashboard
// @route   GET /api/admin/payment-stats
// @access  Private/Admin
router.get('/payment-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { startDate, endDate } = req.query;

    const stats = await Payment.getPaymentStats(startDate, endDate);
    const revenueByPlan = await Payment.getRevenueByPlan(startDate, endDate);
    const monthlyRevenue = await Payment.getMonthlyRevenue(new Date().getFullYear());

    res.json({
      success: true,
      stats,
      revenueByPlan,
      monthlyRevenue,
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get recent payments for admin dashboard
// @route   GET /api/admin/recent-payments
// @access  Private/Admin
router.get('/recent-payments', protect, authorize('admin'), async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const limit = parseInt(req.query.limit) || 10;

    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('subscription', 'plan billingCycle')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all payments for admin dashboard
// @route   GET /api/admin/all-payments
// @access  Private/Admin
router.get('/all-payments', protect, authorize('admin'), async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { page = 1, limit = 20, status, plan, startDate, endDate } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    console.log('📊 Admin fetching payments with filter:', filter);

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('subscription', 'plan billingCycle')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    console.log(`📊 Found ${payments.length} payments (total: ${total})`);

    res.json({
      success: true,
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update payment status (Admin only)
// @route   PUT /api/admin/payments/:id/status
// @access  Private/Admin
router.put('/payments/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status',
      });
    }

    // Find and update payment
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Update status
    const oldStatus = payment.status;
    payment.status = status;

    if (notes) {
      payment.notes = notes;
    }

    // Set paidDate and sync paymentDate if status is completed
    if (status === 'completed' && oldStatus !== 'completed') {
      const now = new Date();
      payment.paidDate = now;
      payment.paymentDate = now; // Sync paymentDate so revenue queries reflect actual completion time
      // Generate receipt number if not exists
      if (!payment.receiptNumber) {
        payment.generateReceiptNumber();
      }
    }

    // Set refund date if status is refunded
    if (status === 'refunded' && oldStatus !== 'refunded') {
      payment.refundDate = new Date();
    }

    await payment.save();

    console.log(`✅ Admin updated payment ${req.params.id} status: ${oldStatus} → ${status}`);

    res.json({
      success: true,
      payment,
      message: `Payment status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    // const publishedCourses = await Course.countDocuments({ isPublished: true });

    // Calculate total revenue from completed payments
    const completedPayments = await Payment.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = completedPayments.length > 0 ? completedPayments[0].totalRevenue : 0;

    // Get completed courses count (simplified)
    const completedCourses = await Course.countDocuments({ isPublished: true });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalRevenue,
        activeUsers,
        completedCourses,
        pendingApprovals: 0, // You can implement this based on your needs
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private/Admin
router.post(
  '/users',
  protect,
  authorize('admin'),
  validateUserRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
        bio,
        phone,
        location,
        website,
        isActive,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        bio,
        phone,
        location,
        website,
        isActive,
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          bio: user.bio,
          phone: user.phone,
          location: user.location,
          website: user.website,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },
);

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, bio, phone, location, website, isActive } =
      req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.bio = bio || user.bio;
    user.phone = phone || user.phone;
    user.location = location || user.location;
    user.website = website || user.website;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        website: user.website,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Toggle user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put(
  '/users/:id/status',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { isActive } = req.body;

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      user.isActive = isActive;
      await user.save();

      res.status(200).json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },
);

// @desc    Get all courses with pagination and filtering
// @route   GET /api/admin/courses
// @access  Private/Admin
router.get('/courses', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || '';

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.isPublished = status === 'published';
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .populate('enrolledStudents', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      courses,
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Create new course
// @route   POST /api/admin/courses
// @access  Private/Admin
router.post(
  '/courses',
  protect,
  authorize('admin'),
  validateCourseCreation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        level,
        duration,
        price,
        instructor,
        isPublished,
        thumbnail,
        curriculum,
      } = req.body;

      // Validate instructor ID
      if (!instructor || !mongoose.Types.ObjectId.isValid(instructor)) {
        return res.status(400).json({
          success: false,
          message: 'Valid instructor ID is required',
        });
      }

      // Check if instructor exists
      const instructorExists = await User.findById(instructor);
      if (!instructorExists) {
        return res.status(400).json({
          success: false,
          message: 'Instructor not found',
        });
      }

      const course = await Course.create({
        title,
        description,
        category,
        level,
        duration,
        price,
        instructor,
        isPublished: isPublished || false,
        thumbnail: thumbnail || '',
        curriculum: curriculum || [],
      });

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        course,
      });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },
);

// @desc    Update course
// @route   PUT /api/admin/courses/:id
// @access  Private/Admin
router.put('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      duration,
      price,
      instructor,
      isPublished,
      thumbnail,
      curriculum,
    } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Update course fields
    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.level = level || course.level;
    course.duration = duration || course.duration;
    course.price = price !== undefined ? price : course.price;
    course.instructor = instructor || course.instructor;
    course.isPublished =
      isPublished !== undefined ? isPublished : course.isPublished;
    course.thumbnail = thumbnail || course.thumbnail;
    course.curriculum = curriculum || course.curriculum;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Delete course
// @route   DELETE /api/admin/courses/:id
// @access  Private/Admin
router.delete('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Toggle course status
// @route   PUT /api/admin/courses/:id/status
// @access  Private/Admin
router.put(
  '/courses/:id/status',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { isPublished } = req.body;

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      course.isPublished = isPublished;
      await course.save();

      res.status(200).json({
        success: true,
        message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
        course: {
          id: course._id,
          title: course.title,
          isPublished: course.isPublished,
        },
      });
    } catch (error) {
      console.error('Toggle course status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },
);

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('🔥🔥🔥 ANALYTICS ENDPOINT CALLED - USING NEW PERCENTAGE CALCULATION 🔥🔥🔥');
    const period = req.query.period || '30';
    const yearFilter = req.query.year; // Optional year filter
    const days = parseInt(period);

    // Calculate rolling date range from current date (automatically handles year transitions)
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date();

    // If year filter is provided and not "all", use that year's range
    if (yearFilter && yearFilter !== 'all') {
      const selectedYear = parseInt(yearFilter);
      startDate = new Date(selectedYear, 0, 1, 0, 0, 0, 0); // Jan 1 of selected year
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999); // Dec 31 of selected year
      console.log(`📊 Fetching analytics for year: ${selectedYear}`);
    } else if (yearFilter === 'all') {
      // For "All Time", get data from the earliest record to now
      const earliestUser = await User.findOne().sort({ createdAt: 1 }).select('createdAt');
      const earliestCourse = await Course.findOne().sort({ createdAt: 1 }).select('createdAt');
      const earliestPayment = await Payment.findOne({ status: 'completed', paidDate: { $ne: null } }).sort({ paidDate: 1 }).select('paidDate');

      // Find the earliest date among all records
      const dates = [];
      if (earliestUser) dates.push(new Date(earliestUser.createdAt));
      if (earliestCourse) dates.push(new Date(earliestCourse.createdAt));
      if (earliestPayment) dates.push(new Date(earliestPayment.paidDate));

      if (dates.length > 0) {
        startDate = new Date(Math.min(...dates));
        startDate.setHours(0, 0, 0, 0);
      } else {
        // If no records exist, default to 1 year ago
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
      }

      console.log(`📊 Fetching ALL TIME analytics (${startDate.toISOString()} to ${endDate.toISOString()})`);
    } else {
      // Use rolling date range (last X days from today)
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      console.log(`📊 Fetching analytics for period: ${days} days (${startDate.toISOString()} to ${endDate.toISOString()})`);
    }

    // Get overview statistics
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const publishedCourses = await Course.countDocuments({ isPublished: true });

    // Calculate total revenue from completed payments
    const completedPayments = await Payment.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = completedPayments.length > 0 ? completedPayments[0].totalRevenue : 0;

    // Get new items added in the current period (last X days)
    const newUsersInPeriod = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const newCoursesInPeriod = await Course.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const newActiveUsersInPeriod = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get revenue from current period (use paidDate for accurate revenue timing)
    const currentPeriodRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const revenueInPeriod = currentPeriodRevenue.length > 0 ? currentPeriodRevenue[0].totalRevenue : 0;

    // Calculate previous period dates (same duration as current period)
    const periodDuration = endDate - startDate;
    const prevPeriodEndDate = new Date(startDate.getTime() - 1); // End of previous period
    const prevPeriodStartDate = new Date(prevPeriodEndDate.getTime() - periodDuration);

    // Get counts from previous period for comparison
    const prevPeriodUsers = await User.countDocuments({
      createdAt: { $gte: prevPeriodStartDate, $lte: prevPeriodEndDate }
    });

    const prevPeriodCourses = await Course.countDocuments({
      createdAt: { $gte: prevPeriodStartDate, $lte: prevPeriodEndDate }
    });

    const prevPeriodActiveUsers = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: prevPeriodStartDate, $lte: prevPeriodEndDate }
    });

    const prevPeriodRevenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidDate: { $gte: prevPeriodStartDate, $lte: prevPeriodEndDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const prevPeriodRevenue = prevPeriodRevenueData.length > 0 ? prevPeriodRevenueData[0].totalRevenue : 0;

    // Calculate growth percentages: ((current - previous) / previous) * 100
    const calculateGrowthPercentage = (currentPeriod, previousPeriod) => {
      if (previousPeriod === 0) {
        // If there were no items in previous period but there are now, return 100% growth
        return currentPeriod > 0 ? 100 : 0;
      }
      return Number((((currentPeriod - previousPeriod) / previousPeriod) * 100).toFixed(1));
    };

    const usersGrowth = calculateGrowthPercentage(newUsersInPeriod, prevPeriodUsers);
    const coursesGrowth = calculateGrowthPercentage(newCoursesInPeriod, prevPeriodCourses);
    const revenueGrowth = calculateGrowthPercentage(revenueInPeriod, prevPeriodRevenue);
    const activeUsersGrowth = calculateGrowthPercentage(newActiveUsersInPeriod, prevPeriodActiveUsers);

    // Debug logging
    console.log('📊 Analytics Growth Calculation Debug:');
    console.log(`   Current Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`   Previous Period: ${prevPeriodStartDate.toISOString()} to ${prevPeriodEndDate.toISOString()}`);
    console.log(`   Users: Current=${newUsersInPeriod}, Previous=${prevPeriodUsers}, Growth=${usersGrowth}%`);
    console.log(`   Courses: Current=${newCoursesInPeriod}, Previous=${prevPeriodCourses}, Growth=${coursesGrowth}%`);
    console.log(`   Revenue: Current=${revenueInPeriod}, Previous=${prevPeriodRevenue}, Growth=${revenueGrowth}%`);
    console.log(`   Active Users: Current=${newActiveUsersInPeriod}, Previous=${prevPeriodActiveUsers}, Growth=${activeUsersGrowth}%`);

    // Calculate Daily Active Users (users who logged in today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyActiveUsers = await User.countDocuments({
      lastLogin: { $gte: today, $lt: tomorrow }
    });

    // Calculate Daily Active Users for yesterday for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayActiveUsers = await User.countDocuments({
      lastLogin: { $gte: yesterday, $lt: today }
    });

    const dailyActiveUsersGrowth = calculateGrowthPercentage(dailyActiveUsers, yesterdayActiveUsers);

    // Calculate Course Completions this month (ALL USERS - including students, instructors, and admins)
    const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const Progress = require('../models/Progress');

    // Count ALL completions this month (regardless of user role)
    // This ensures instructors and admins who complete courses are also counted
    const courseCompletionsThisMonth = await Progress.countDocuments({
      isCompleted: true,
      completionDate: { $gte: monthStart, $lte: monthEnd }
    });

    // Calculate course completions for previous month for comparison (ALL USERS)
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(monthStart);
    prevMonthEnd.setTime(prevMonthEnd.getTime() - 1);

    const courseCompletionsPrevMonth = await Progress.countDocuments({
      isCompleted: true,
      completionDate: { $gte: prevMonthStart, $lte: prevMonthEnd }
    });

    const courseCompletionsGrowth = calculateGrowthPercentage(courseCompletionsThisMonth, courseCompletionsPrevMonth);

    console.log('📊 Course Completions Calculation:');
    console.log(`   This Month (${monthStart.toISOString().split('T')[0]} to ${monthEnd.toISOString().split('T')[0]}): ${courseCompletionsThisMonth}`);
    console.log(`   Previous Month (${prevMonthStart.toISOString().split('T')[0]} to ${prevMonthEnd.toISOString().split('T')[0]}): ${courseCompletionsPrevMonth}`);
    console.log(`   Growth: ${courseCompletionsGrowth > 0 ? '+' : ''}${courseCompletionsGrowth}%`);

    // Calculate Average Rating across all courses
    const ratingStats = await Course.aggregate([
      {
        $match: {
          isPublished: true,
          averageRating: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$averageRating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const currentAverageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;

    // Calculate previous period's average rating (30 days ago)
    const ratingPrevPeriod = await Course.aggregate([
      {
        $match: {
          isPublished: true,
          averageRating: { $gt: 0 },
          updatedAt: { $lte: prevPeriodEndDate }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$averageRating' }
        }
      }
    ]);

    const prevAverageRating = ratingPrevPeriod.length > 0 ? ratingPrevPeriod[0].averageRating : currentAverageRating;
    const averageRatingChange = Number((currentAverageRating - prevAverageRating).toFixed(1));

    console.log('📊 User Activity Metrics:');
    console.log(`   Daily Active Users: ${dailyActiveUsers} (${dailyActiveUsersGrowth > 0 ? '+' : ''}${dailyActiveUsersGrowth}%)`);
    console.log(`   Course Completions This Month (All Users): ${courseCompletionsThisMonth} (${courseCompletionsGrowth > 0 ? '+' : ''}${courseCompletionsGrowth}%)`);
    console.log(`   Average Rating: ${currentAverageRating.toFixed(1)} (${averageRatingChange > 0 ? '+' : ''}${averageRatingChange})`);

    // Get top courses
    const topCourses = await Course.find({ isPublished: true })
      .populate('instructor', 'name')
      .populate('enrolledStudents', 'name')
      .sort({ enrolledStudents: -1 })
      .limit(5);

    // Get recent activities (simplified)
    const recentActivities = [
      {
        message: 'New user registered',
        createdAt: new Date(),
      },
      {
        message: 'Course published',
        createdAt: new Date(),
      },
    ];

    // Get monthly statistics using rolling date range (handles year transitions automatically)
    const monthlyStats = await getRollingMonthlyStatistics(startDate, endDate);
    console.log(`📊 Monthly statistics retrieved: ${monthlyStats.length} periods`);

    // Format data for User Growth chart (both users and courses)
    const userGrowth = monthlyStats.map(stat => ({
      label: stat.label,
      month: stat.month,
      users: stat.users,
      courses: stat.courses,
      date: stat.date
    }));

    // Format data for Revenue chart
    const revenueData = monthlyStats.map(stat => ({
      label: stat.label,
      month: stat.month,
      revenue: stat.revenue,
      date: stat.date
    }));

    console.log('🚀 SENDING ANALYTICS RESPONSE:');
    console.log(`   usersGrowth: ${usersGrowth}%`);
    console.log(`   coursesGrowth: ${coursesGrowth}%`);
    console.log(`   revenueGrowth: ${revenueGrowth}%`);
    console.log(`   activeUsersGrowth: ${activeUsersGrowth}%`);

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          totalCourses,
          totalRevenue,
          activeUsers,
          completedCourses: publishedCourses,
          averageRating: Number(currentAverageRating.toFixed(1)),
          usersGrowth,
          coursesGrowth,
          revenueGrowth,
          activeUsersGrowth,
        },
        userActivity: {
          dailyActiveUsers,
          dailyActiveUsersGrowth,
          courseCompletionsThisMonth,
          courseCompletionsGrowth,
          averageRating: Number(currentAverageRating.toFixed(1)),
          averageRatingChange,
        },
        userGrowth,
        revenueData,
        courseStats: [],
        topCourses,
        userEngagement: [],
        monthlyStats,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Export analytics report
// @route   GET /api/admin/analytics/export
// @access  Private/Admin
router.get(
  '/analytics/export',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const format = req.query.format || 'pdf';
      // const period = req.query.period || '30';

      // This is a placeholder for export functionality
      // You would implement actual PDF/CSV generation here
      res.status(200).json({
        success: true,
        message: `Export functionality for ${format} format coming soon`,
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },
);

// @desc    Get recent admin activities (users, notifications, announcements, forums)
// @route   GET /api/admin/activities
// @access  Private/Admin
router.get('/activities', protect, authorize('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [recentUsers, recentNotifications, recentAnnouncements, recentForums] = await Promise.all([
      User.find().select('name email createdAt').sort({ createdAt: -1 }).limit(limit),
      require('../models/Notification').find().select('title createdAt').sort({ createdAt: -1 }).limit(limit),
      require('../models/Announcement').find().select('title createdAt').sort({ createdAt: -1 }).limit(limit),
      require('../models/DiscussionForum').find().select('title createdAt').sort({ createdAt: -1 }).limit(limit),
    ]);

    const activities = [];

    for (const u of recentUsers) {
      activities.push({ type: 'user_created', message: `Created user ${u.name || u.email}`, createdAt: u.createdAt });
    }
    for (const n of recentNotifications) {
      activities.push({ type: 'notification_created', message: `Created notification: ${n.title}`, createdAt: n.createdAt });
    }
    for (const a of recentAnnouncements) {
      activities.push({ type: 'announcement_created', message: `Created announcement: ${a.title}`, createdAt: a.createdAt });
    }
    for (const f of recentForums) {
      activities.push({ type: 'forum_created', message: `Created discussion forum: ${f.title}`, createdAt: f.createdAt });
    }

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const sliced = activities.slice(0, limit);

    res.json({ success: true, activities: sliced });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
