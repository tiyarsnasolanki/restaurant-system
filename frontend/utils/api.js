import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Menu
export const getMenu = () => axios.get(`${API_URL}/menu`);
export const getAllMenuItems = () => axios.get(`${API_URL}/menu/all`);
export const addMenuItem = (data) => axios.post(`${API_URL}/menu`, data);
export const updateMenuItem = (id, data) => axios.put(`${API_URL}/menu/${id}`, data);
export const deleteMenuItem = (id) => axios.delete(`${API_URL}/menu/${id}`);

// Orders
export const createOrder = (data) => axios.post(`${API_URL}/orders`, data);
export const getOrders = (params) => axios.get(`${API_URL}/orders`, { params });
export const getOrderById = (id) => axios.get(`${API_URL}/orders/${id}`);
export const updateOrderStatus = (id, data) => axios.patch(`${API_URL}/orders/${id}/status`, data);
export const sendBill = (id) => axios.post(`${API_URL}/orders/${id}/send-bill`);
export const getKitchenOrders = () => axios.get(`${API_URL}/orders/kitchen`);
export const getTodaysSummary = () => axios.get(`${API_URL}/orders/summary/today`);
export const updateItemStatus = (id, data) => axios.patch(`${API_URL}/orders/${id}/item-status`, data);

// Expenses
export const getExpenses = (params) => axios.get(`${API_URL}/expenses`, { params });
export const addExpense = (data) => axios.post(`${API_URL}/expenses`, data);
export const updateExpense = (id, data) => axios.put(`${API_URL}/expenses/${id}`, data);
export const deleteExpense = (id) => axios.delete(`${API_URL}/expenses/${id}`);

// Reservations
export const getReservations = () => axios.get(`${API_URL}/reservations`);
export const addReservation = (data) => axios.post(`${API_URL}/reservations`, data);
export const updateReservation = (id, data) => axios.put(`${API_URL}/reservations/${id}`, data);
export const deleteReservation = (id) => axios.delete(`${API_URL}/reservations/${id}`);

// Reports
export const getDailyReport = (date) => axios.get(`${API_URL}/reports/daily`, { params: { date } });
export const getMonthlyReport = (year, month) => axios.get(`${API_URL}/reports/monthly`, { params: { year, month } });
export const getYearlyReport = (year) => axios.get(`${API_URL}/reports/yearly`, { params: { year } });
export const getTopItems = (days) => axios.get(`${API_URL}/reports/top-items`, { params: { days } });

// Inventory
export const getInventory = () => axios.get(`${API_URL}/inventory`);
export const addInventoryItem = (data) => axios.post(`${API_URL}/inventory`, data);
export const updateInventoryItem = (id, data) => axios.put(`${API_URL}/inventory/${id}`, data);

// Staff
export const getStaff = () => axios.get(`${API_URL}/staff`);
export const toggleStaff = (id) => axios.patch(`${API_URL}/staff/${id}/toggle`);
export const deleteStaff = (id) => axios.delete(`${API_URL}/staff/${id}`);

// Auth
export const registerStaff = (data) => axios.post(`${API_URL}/auth/register`, data);
export const changePassword = (data) => axios.post(`${API_URL}/auth/change-password`, data);
