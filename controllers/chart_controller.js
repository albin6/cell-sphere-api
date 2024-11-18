import AsyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import SalesReport from "../models/salesModel.js";

// for getting the users count
//  GET /api/admin/users-count
export const get_dashboard_data = AsyncHandler(async (req, res) => {
  const total_users_count = await User.countDocuments({});
  const total_orders_count = await Order.countDocuments({});
  const total_sales = await SalesReport.aggregate([
    { $group: { _id: null, sum: { $sum: "$finalAmount" } } },
  ]);

  const totalPendingOrders = await Order.aggregate([
    { $match: { "order_items.order_status": "Pending" } },
    { $count: "totalPendingOrders" },
  ]);

  const dashboard_data = {
    totalUsers: total_users_count,
    totalOrders: total_orders_count,
    totalSales: total_sales[0]?.sum,
    totalPendingOrders: totalPendingOrders[0]?.totalPendingOrders,
  };

  res.json(dashboard_data);
});

// for getting data for chart
// /api/admin/chart-data

export const get_chart_data = AsyncHandler(async (req, res) => {
  const { year, month } = req.query;

  const currentYear = new Date().getFullYear();
  if (year && (isNaN(year) || year < 2000 || year > currentYear)) {
    return res.status(400).json({ message: "Invalid year" });
  }
  if (month && (isNaN(month) || month < 1 || month > 12)) {
    return res.status(400).json({ message: "Invalid month" });
  }

  let startDate, endDate;
  if (year && month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);
  } else if (year) {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
  } else {
    const currentYear = new Date().getFullYear();
    startDate = new Date(currentYear, 0, 1);
    endDate = new Date(currentYear, 11, 31);
  }

  const orderPipeline = [
    {
      $match: {
        placed_at: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$placed_at" } },
        sales: { $sum: "$total_price_with_discount" },
        orderCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        sales: { $round: ["$sales", 2] },
        orderCount: 1,
      },
    },
    { $sort: { name: 1 } },
  ];

  const userPipeline = [
    {
      $match: {
        created_on: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$created_on" } },
        customers: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        customers: 1,
      },
    },
    { $sort: { name: 1 } },
  ];

  const [orderResults, userResults, sales] = await Promise.all([
    Order.aggregate(orderPipeline),
    User.aggregate(userPipeline),
    SalesReport.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, sum: { $sum: "$finalAmount" } } },
    ]),
  ]);

  // Merge order and user results
  const mergedResults = orderResults.map((orderData) => {
    const userData = userResults.find((u) => u.name === orderData.name) || {
      customers: 0,
    };
    return { ...orderData, customers: userData.customers };
  });

  // Calculate totals
  const totals = mergedResults.reduce(
    (acc, curr) => {
      acc.totalCustomers += curr.customers;
      acc.totalOrders += curr.orderCount;
      return acc;
    },
    { totalCustomers: 0, totalOrders: 0 }
  );

  res.json({
    overview: mergedResults,
    totals: {
      sales: Number(sales[0]?.sum.toFixed(2)) || 0,
      customers: totals.totalCustomers,
      orders: totals.totalOrders,
    },
  });
});
