import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { router } from './router.js';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
