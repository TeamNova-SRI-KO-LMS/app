# Analytics Charts Documentation

## Overview
This directory contains chart components for the Admin Analytics Dashboard using Chart.js and react-chartjs-2.

## Components

### 1. UserGrowthChart
**Purpose**: Displays user or course growth over time with a line chart.

**Props**:
- `data` (Array): Array of monthly statistics with `users`, `courses`, and `label` properties
- `selectedMetric` (String): Either 'users' or 'courses' to determine which metric to display

**Features**:
- Smooth line animation with area fill
- Toggle between users and courses metrics
- Responsive design
- Default sample data if no data provided

**Example Usage**:
```jsx
<UserGrowthChart 
  data={analytics.userGrowth} 
  selectedMetric={selectedMetric}
/>
```

---

### 2. RevenueChart
**Purpose**: Displays revenue trends over time with a line chart.

**Props**:
- `data` (Array): Array of monthly statistics with `revenue` and `label` properties
- `formatCurrency` (Function): Optional function to format currency values

**Features**:
- Currency formatting in tooltips and Y-axis
- Smooth line animation with area fill
- Responsive design
- Default sample data if no data provided

**Example Usage**:
```jsx
<RevenueChart 
  data={analytics.revenueData}
  formatCurrency={formatCurrency}
/>
```

---

### 3. UserCourseComparisonChart
**Purpose**: Side-by-side comparison of user registrations and course enrollments using a bar chart.

**Props**:
- `data` (Array): Array of monthly statistics with `users`, `courses`, and `label` properties

**Features**:
- Dual dataset (users and courses) comparison
- Color-coded bars for easy distinction
- Responsive design
- Default sample data if no data provided

**Example Usage**:
```jsx
<UserCourseComparisonChart data={analytics.monthlyStats} />
```

---

## Data Structure

All charts expect data in the following format:

```javascript
[
  {
    label: "Jan",           // Short month name
    month: "January",       // Full month name
    users: 12,             // Number of new users
    courses: 5,            // Number of new courses
    revenue: 45000,        // Revenue amount
    year: 2024,            // Year
    date: "2024-01"        // ISO date format
  },
  // ... more months
]
```

## Chart.js Configuration

All charts are configured with:
- Responsive behavior
- Custom tooltips with dark theme
- Grid lines with subtle colors
- Inter font family
- Smooth animations
- Hover interactions

## Dependencies

- `chart.js`: ^4.5.1
- `react-chartjs-2`: ^5.3.1

## Color Scheme

- **Users**: Blue (`rgb(59, 130, 246)`)
- **Courses**: Green (`rgb(34, 197, 94)`)
- **Revenue**: Orange (`rgb(251, 146, 60)`)

## Backend API

The charts receive data from the `/api/admin/analytics` endpoint which returns:

```javascript
{
  success: true,
  analytics: {
    overview: { ... },
    userGrowth: [ ... ],      // For UserGrowthChart
    revenueData: [ ... ],     // For RevenueChart
    monthlyStats: [ ... ],    // For UserCourseComparisonChart
    topCourses: [ ... ],
    // ... other data
  }
}
```

## Customization

To customize chart appearance, modify the `options` object in each component:
- Colors: Update `borderColor` and `backgroundColor` in datasets
- Fonts: Modify `font` properties in scales and plugins
- Grid: Adjust `grid` properties in scales
- Tooltips: Customize `tooltip` in plugins

## Troubleshooting

**Chart not displaying:**
1. Verify Chart.js is properly installed
2. Check that data is in correct format
3. Ensure all Chart.js components are registered

**Data not updating:**
1. Verify backend is returning correct data structure
2. Check React state updates in parent component
3. Confirm analytics API endpoint is accessible

**Styling issues:**
1. Ensure Tailwind CSS is properly configured
2. Check container height classes (h-64, h-80, etc.)
3. Verify responsive classes are applied

