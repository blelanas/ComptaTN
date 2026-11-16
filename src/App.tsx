import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import AppShell from '@/layout/AppShell';
import DashboardPage from '@/pages/app/DashboardPage';
import ComingSoonPage from '@/pages/app/ComingSoonPage';
import PlanComptablePage from '@/features/plan-comptable/PlanComptablePage';
import { PlanComptableProvider } from '@/features/plan-comptable/store';
import { NAV_ITEMS } from '@/lib/navigation';
import { CompanyProvider } from '@/lib/company';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <CompanyProvider>
            <PlanComptableProvider>
              <AppShell />
            </PlanComptableProvider>
          </CompanyProvider>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="comptabilite/plan-comptable" element={<PlanComptablePage />} />
        {NAV_ITEMS.filter((item) => item.status === 'soon').map((item) => (
          <Route key={item.path} path={item.path.replace(/^\/app\//, '')} element={<ComingSoonPage item={item} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
