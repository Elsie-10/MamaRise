import { Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "./pages/landing/LandingPage";
import AuthPage from "./pages/auth/AuthPage";
import MotherDashboard from "./pages/dashboard/MotherDashboard";
import WellbeingPage from "./pages/wellbeing/WellbeingPage";
import PlannerPage from "./pages/planner/PlannerPage";
import AppointmentsPage from "./pages/appointments/AppointmentsPage";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

function ComingSoon({ page }: { page: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-primary-700">{page}</h2>
      <p className="mt-3 text-muted">This section is being prepared.</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      {/* Mother application */}
      <Route element={<ProtectedRoute allowedRoles={["mother"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<MotherDashboard />} />
          <Route path="/wellbeing" element={<WellbeingPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Route>

      {/* Employer application */}
      <Route element={<ProtectedRoute allowedRoles={["employer"]} />}>
        <Route element={<AppLayout />}>
          <Route
            path="/employer"
            element={<ComingSoon page="Employer Portal" />}
          />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
