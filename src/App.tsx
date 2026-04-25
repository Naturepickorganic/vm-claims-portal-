import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }              from '@/lib/authContext'
import Home                         from '@/pages/Home'
import Login                        from '@/pages/Login'
import Signup                       from '@/pages/Signup'
import TrackClaim                   from '@/pages/TrackClaim'
import FileClaimStart               from '@/pages/FileClaimStart'
import ThirdPartyFNOL               from '@/pages/ThirdPartyFNOL'
import FNOLWizard                   from '@/pages/claims/auto/FNOLWizard'
import ClaimStatus                  from '@/pages/claims/auto/ClaimStatus'
import ClaimClosure                 from '@/pages/claims/auto/ClaimClosure'
import HomeFNOLWizard               from '@/pages/claims/home/HomeFNOLWizard'
import HomeClaimStatus              from '@/pages/claims/home/HomeClaimStatus'
import CommercialAutoFNOLWizard     from '@/pages/claims/commercial-auto/CommercialAutoFNOLWizard'
import CommercialAutoClaimStatus    from '@/pages/claims/commercial-auto/CommercialAutoClaimStatus'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/"                              element={<Home />} />
        <Route path="/login"                         element={<Login />} />
        <Route path="/signup"                        element={<Signup />} />
        <Route path="/track"                         element={<TrackClaim />} />
        <Route path="/file-claim"                    element={<FileClaimStart />} />
        <Route path="/claims/third-party/new"        element={<ThirdPartyFNOL />} />

        {/* Personal Auto */}
        <Route path="/claims/auto/new"               element={<FNOLWizard />} />
        <Route path="/claims/auto/:id/status"        element={<ClaimStatus />} />
        <Route path="/claims/auto/:id/closure"       element={<ClaimClosure />} />

        {/* Personal Home */}
        <Route path="/claims/home/new"               element={<HomeFNOLWizard />} />
        <Route path="/claims/home/:id/status"        element={<HomeClaimStatus />} />

        {/* Commercial Auto */}
        <Route path="/claims/commercial-auto/new"          element={<CommercialAutoFNOLWizard />} />
        <Route path="/claims/commercial-auto/:id/status"   element={<CommercialAutoClaimStatus />} />

        {/* Legacy compat */}
        <Route path="/claims/:id/status"             element={<ClaimStatus />} />
        <Route path="/claims/:id/closure"            element={<ClaimClosure />} />

        <Route path="*"                              element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
