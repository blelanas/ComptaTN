import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import AppShell from '@/layout/AppShell';
import DashboardPage from '@/pages/app/DashboardPage';
import ComingSoonPage from '@/pages/app/ComingSoonPage';
import PlanComptablePage from '@/features/plan-comptable/PlanComptablePage';
import { PlanComptableProvider } from '@/features/plan-comptable/store';
import OnboardingPage from '@/features/societes/OnboardingPage';
import SettingsPage from '@/features/societes/SettingsPage';
import { NAV_ITEMS } from '@/lib/navigation';
import { CompanyProvider } from '@/lib/company';
import { RequireSession, SessionLayout, useSession } from '@/lib/session';

/**
 * /demo: old links. The public demo is gone; the local (browser-only) mode
 * remains for development when Firebase is not configured.
 */
function StartDemo() {
  const { state, cloudAvailable, startDemo } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (cloudAvailable === null) return;
    if (cloudAvailable) {
      navigate(state.status === 'signed-in' ? '/app' : '/connexion', { replace: true });
      return;
    }
    startDemo();
    navigate('/app', { replace: true });
  }, [cloudAvailable, state.status, startDemo, navigate]);
  return null;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<SessionLayout />}>
        <Route path="/connexion" element={<AuthPage mode="connexion" />} />
        <Route path="/inscription" element={<AuthPage mode="inscription" />} />
        <Route path="/mot-de-passe-oublie" element={<AuthPage mode="reset" />} />
        <Route path="/demo" element={<StartDemo />} />
        <Route
          path="/app"
          element={
            <RequireSession>
              <CompanyProvider onboarding={<OnboardingPage />}>
                <PlanComptableProvider>
                  <AppShell />
                </PlanComptableProvider>
              </CompanyProvider>
            </RequireSession>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="comptabilite/plan-comptable" element={<PlanComptablePage />} />
          <Route path="parametres" element={<SettingsPage />} />
          {NAV_ITEMS.filter((item) => item.status === 'soon').map((item) => (
            <Route key={item.path} path={item.path.replace(/^\/app\//, '')} element={<ComingSoonPage item={item} />} />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
