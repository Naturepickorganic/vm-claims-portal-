import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from '@/lib/authContext'
import Home             from '@/pages/Home'
import Login            from '@/pages/Login'
import Signup           from '@/pages/Signup'
import TrackClaim       from '@/pages/TrackClaim'
import FileClaimStart   from '@/pages/FileClaimStart'
import FNOLWizard       from '@/pages/claims/auto/FNOLWizard'
import ClaimStatus      from '@/pages/claims/auto/ClaimStatus'
import ClaimClosure     from '@/pages/claims/auto/ClaimClosure'
import HomeFNOLWizard   from '@/pages/claims/home/HomeFNOLWizard'
import HomeClaimStatus  from '@/pages/claims/home/HomeClaimStatus'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public pages */}
        <Route path="/"           element={<Home />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/signup"     element={<Signup />} />
        <Route path="/track"      element={<TrackClaim />} />
        <Route path="/file-claim" element={<FileClaimStart />} />

        {/* Claims flows */}
        <Route path="/claims/auto/new"         element={<FNOLWizard />} />
        <Route path="/claims/auto/:id/status"  element={<ClaimStatus />} />
        <Route path="/claims/auto/:id/closure" element={<ClaimClosure />} />
        <Route path="/claims/home/new"         element={<HomeFNOLWizard />} />
        <Route path="/claims/home/:id/status"  element={<HomeClaimStatus />} />
        <Route path="/claims/:id/status"       element={<ClaimStatus />} />
        <Route path="/claims/:id/closure"      element={<ClaimClosure />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
