import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Layout } from './components/Layout'

import { Dashboard } from './pages/Dashboard'
import { Contacts } from './pages/Contacts'
import { Conversations } from './pages/Conversations'
import { Prospects } from './pages/Prospects'
import { Campaigns } from './pages/Campaigns'
import { Templates } from './pages/Templates'
import { Reports } from './pages/Reports'
import { Funnel } from './pages/Funnel'
import { Automations } from './pages/Automations'
import { Tags } from './pages/Tags'
import { Team } from './pages/Team'
import { Settings } from './pages/Settings'

import './index.css'

// TODO: Reativar Clerk quando configurado
// import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
// import { ptBR } from '@clerk/localizations'
// const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="conversations/:id" element={<Conversations />} />
            <Route path="prospects" element={<Prospects />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="templates" element={<Templates />} />
            <Route path="reports" element={<Reports />} />
            <Route path="funnel" element={<Funnel />} />
            <Route path="automations" element={<Automations />} />
            <Route path="tags" element={<Tags />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
