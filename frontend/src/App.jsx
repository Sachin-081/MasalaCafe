
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Menu from "./pages/student/Menu";
import Cart from "./pages/student/Cart";
import Dashboard from "./pages/student/Dashboard";
import Checkout from "./pages/student/Checkout";
import MyOrders from "./pages/student/MyOrders";

import KitchenDashboard from "./pages/kitchen/Dashboard";

import AdminDashboard from "./pages/admin/Dashboard";
import MenuManagement from "./pages/admin/MenuManagement";
import Inventory from "./pages/admin/Inventory";
import Orders from "./pages/admin/Orders";
import KitchenUsers from "./pages/admin/KitchenUsers";
import StudentAccount from "./pages/student/Account";
import AccountDeletionRequests from "./pages/admin/AccountDeletionRequests";

const Analytics = lazy(() => import("./pages/admin/Analytics"));

const roleHome = { student: "/", kitchen: "/kitchen", admin: "/admin" };

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || "/login"} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <Menu />
        </ProtectedRoute>
      } />

      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <Cart />
        </ProtectedRoute>
      } />

      <Route path="/checkout" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <Checkout />
        </ProtectedRoute>
      } />

      <Route path="/my-orders" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <MyOrders />
        </ProtectedRoute>
      } />

      <Route path="/account" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentAccount />
        </ProtectedRoute>
      } />

      <Route path="/kitchen" element={
        <ProtectedRoute allowedRoles={["admin", "kitchen"]}>
          <KitchenDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin/menu" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <MenuManagement />
        </ProtectedRoute>
      } />

      <Route path="/admin/inventory" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Inventory />
        </ProtectedRoute>
      } />

      <Route path="/admin/orders" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Orders />
        </ProtectedRoute>
      } />

      <Route path="/admin/analytics" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Suspense fallback={<div className="loading-state">Loading analytics...</div>}>
            <Analytics />
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="/admin/kitchen-users" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <KitchenUsers />
        </ProtectedRoute>
      } />

      <Route path="/admin/account-deletion-requests" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AccountDeletionRequests />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
