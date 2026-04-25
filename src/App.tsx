import { Routes, Route, Navigate } from 'react-router-dom'
import Home            from '@/pages/Home'
import FNOLWizard      from '@/pages/claims/auto/FNOLWizard'
import ClaimStatus     from '@/pages/claims/auto/ClaimStatus'
import ClaimClosure    from '@/pages/claims/auto/ClaimClosure'
import HomeFNOLWizard  from '@/pages/claims/home/HomeFNOLWizard'
import HomeClaimStatus from '@/pages/claims/home/HomeClaimStatus'

export default function App() {
  return (
    <Routes>
      <Route path="/"                           element={<Home />} />
      <Route path="/claims/auto/new"            element={<FNOLWizard />} />
      <Route path="/claims/auto/:id/status"     element={<ClaimStatus />} />
      <Route path="/claims/auto/:id/closure"    element={<ClaimClosure />} />
      <Route path="/claims/home/new"            element={<HomeFNOLWizard />} />
      <Route path="/claims/home/:id/status"     element={<HomeClaimStatus />} />
      {/* Legacy compat */}
      <Route path="/claims/:id/status"          element={<ClaimStatus />} />
      <Route path="/claims/:id/closure"         element={<ClaimClosure />} />
      <Route path="*"                           element={<Navigate to="/" replace />} />
    </Routes>
  )
}
