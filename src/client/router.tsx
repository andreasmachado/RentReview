import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.js';
import { RequireAuth } from './components/RequireAuth.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import VerifyEmailPage from './pages/VerifyEmailPage.js';
import DashboardPage from './pages/DashboardPage.js';
import SearchPage from './pages/SearchPage.js';
import ProfilePage from './pages/ProfilePage.js';
import ProfileEditPage from './pages/ProfileEditPage.js';
import MyPropertiesPage from './pages/MyPropertiesPage.js';
import PropertyDetailPage from './pages/PropertyDetailPage.js';
import WriteReviewPage from './pages/WriteReviewPage.js';
import RankingsTenantsPage from './pages/RankingsTenantsPage.js';
import RankingsLandlordsPage from './pages/RankingsLandlordsPage.js';
import RankingsPropertiesPage from './pages/RankingsPropertiesPage.js';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'users/:id', element: <ProfilePage /> },
      { path: 'profile/edit', element: <ProfileEditPage /> },
      { path: 'my-properties', element: <MyPropertiesPage /> },
      { path: 'properties/:id', element: <PropertyDetailPage /> },
      { path: 'write-review', element: <WriteReviewPage /> },
      { path: 'rankings/tenants', element: <RankingsTenantsPage /> },
      { path: 'rankings/landlords', element: <RankingsLandlordsPage /> },
      { path: 'rankings/properties', element: <RankingsPropertiesPage /> },
    ],
  },
]);
