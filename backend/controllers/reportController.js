const Order = require('../models/Order');
const Expense = require('../models/Expense');
const MenuItem = require('../models/MenuItem');

// GET /api/reports/daily?date=YYYY-MM-DD
const getDailyReport = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    });

    const expenses = await Expense.find({ date: { $gte: start, $lte: end } });

    const totalSales = orders.reduce((s, o) => s + o.finalTotal, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const profit = totalSales - totalExpenses;

    // Payment breakdown
    const paymentBreakdown = orders.reduce((acc, o) => {
      acc[o.paymentMode] = (acc[o.paymentMode] || 0) + o.finalTotal;
      return acc;
    }, {});

    // Top items
    const itemMap = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (itemMap[item.name]) {
          itemMap[item.name].qty += item.quantity;
          itemMap[item.name].revenue += item.total;
        } else {
          itemMap[item.name] = { qty: item.quantity, revenue: item.total };
        }
      });
    });
    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data }));

    res.json({
      success: true,
      date: date.toISOString().split('T')[0],
      totalOrders: orders.length,
      totalSales,
      totalExpenses,
      profit,
      paymentBreakdown,
      topItems,
      orders: orders.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/monthly?year=2024&month=1
const getMonthlyReport = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    });

    const expenses = await Expense.find({ date: { $gte: start, $lte: end } });

    // Daily aggregation for chart
    const dailyData = {};
    for (let d = 1; d <= end.getDate(); d++) {
      dailyData[d] = { sales: 0, orders: 0 };
    }
    orders.forEach((o) => {
      const day = new Date(o.createdAt).getDate();
      dailyData[day].sales += o.finalTotal;
      dailyData[day].orders += 1;
    });

    const dailyExpenseData = {};
    expenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      dailyExpenseData[day] = (dailyExpenseData[day] || 0) + e.amount;
    });

    const chartData = Object.entries(dailyData).map(([day, data]) => ({
      day: Number(day),
      sales: data.sales,
      orders: data.orders,
      expenses: dailyExpenseData[day] || 0,
      profit: data.sales - (dailyExpenseData[day] || 0),
    }));

    const totalSales = orders.reduce((s, o) => s + o.finalTotal, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({
      success: true,
      year, month,
      totalOrders: orders.length,
      totalSales,
      totalExpenses,
      profit: totalSales - totalExpenses,
      chartData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/yearly?year=2024
const getYearlyReport = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    });

    const expenses = await Expense.find({ date: { $gte: start, $lte: end } });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((m, i) => ({ month: m, sales: 0, orders: 0, expenses: 0, profit: 0 }));

    orders.forEach((o) => {
      const m = new Date(o.createdAt).getMonth();
      monthlyData[m].sales += o.finalTotal;
      monthlyData[m].orders += 1;
    });

    expenses.forEach((e) => {
      const m = new Date(e.date).getMonth();
      monthlyData[m].expenses += e.amount;
    });

    monthlyData.forEach((m) => { m.profit = m.sales - m.expenses; });

    const totalSales = orders.reduce((s, o) => s + o.finalTotal, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({
      success: true,
      year,
      totalSales,
      totalExpenses,
      profit: totalSales - totalExpenses,
      chartData: monthlyData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/top-items
const getTopItems = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const orders = await Order.find({
      createdAt: { $gte: since },
      status: { $ne: 'cancelled' },
    });

    const itemMap = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (itemMap[item.name]) {
          itemMap[item.name].qty += item.quantity;
          itemMap[item.name].revenue += item.total;
        } else {
          itemMap[item.name] = { qty: item.quantity, revenue: item.total };
        }
      });
    });

    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 20)
      .map(([name, data]) => ({ name, ...data }));

    res.json({ success: true, topItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDailyReport, getMonthlyReport, getYearlyReport, getTopItems };
