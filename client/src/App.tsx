import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

function ComingSoon({ page }: { page: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-primary-700">MamaRise</h1>
        <p className="mt-3 text-muted">{page} is being prepared.</p>
      </div>
    </main>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<ComingSoon page="Login" />} />
      <Route path="/register" element={<ComingSoon page="Registration" />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<ComingSoon page="Dashboard" />} />
        <Route path="/wellbeing" element={<ComingSoon page="Wellbeing" />} />
        <Route
          path="/planner"
          element={<ComingSoon page="Return-to-Work Planner" />}
        />
        <Route
          path="/appointments"
          element={<ComingSoon page="Appointments" />}
        />
        <Route
          path="/employer"
          element={<ComingSoon page="Employer Portal" />}
        />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
