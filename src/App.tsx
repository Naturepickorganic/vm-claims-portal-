import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider }              from '@/lib/authContext'
import Home                         from '@/pages/Home'
import Login                        from '@/pages/Login'
import Signup                       from '@/pages/Signup'
import TrackClaim                   from '@/pages/TrackClaim'
import FileClaimStart               from '@/pages/FileClaimStart'
import ThirdPartyFNOL               from '@/pages/ThirdPartyFNOL'
import ClaimSearch                  from '@/pages/ClaimSearch'
import RoadsideAssistance           from '@/pages/RoadsideAssistance'
import TrackResult                  from '@/pages/TrackResult'
import GlassFNOLWizard              from '@/pages/claims/glass/GlassFNOLWizard'
import FNOLWizard                   from '@/pages/claims/auto/FNOLWizard'
import ClaimStatus                  from '@/pages/claims/auto/ClaimStatus'
import ClaimClosure                 from '@/pages/claims/auto/ClaimClosure'
import HomeFNOLWizard               from '@/pages/claims/home/HomeFNOLWizard'
import HomeClaimStatus              from '@/pages/claims/home/HomeClaimStatus'
import CommercialAutoFNOLWizard     from '@/pages/claims/commercial-auto/CommercialAutoFNOLWizard'
import CommercialAutoClaimStatus    from '@/pages/claims/commercial-auto/CommercialAutoClaimStatus'

/* ── RedirectToSearch ──────────────────────────────────────────────────────
   Intercepts all old ClaimStatus routes and redirects to the new
   ClaimSearch detail page. Keeps old status files untouched.
   ─────────────────────────────────────────────────────────────────────── */
function RedirectToSearch() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/claims/search?claim=${id}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"                                   element={<Home />} />
        <Route path="/login"                              element={<Login />} />
        <Route path="/signup"                             element={<Signup />} />
        <Route path="/track"                              element={<TrackClaim />} />
        <Route path="/file-claim"                         element={<FileClaimStart />} />
        <Route path="/claims/third-party/new"             element={<ThirdPartyFNOL />} />
        <Route path="/claims/search"                      element={<ClaimSearch />} />
        <Route path="/roadside"                           element={<RoadsideAssistance />} />
        <Route path="/track/result"                       element={<TrackResult />} />
        <Route path="/claims/glass/new"                   element={<GlassFNOLWizard />} />
        <Route path="/claims/auto/new"                    element={<FNOLWizard />} />
        <Route path="/claims/auto/:id/status"             element={<RedirectToSearch />} />
        <Route path="/claims/auto/:id/closure"            element={<ClaimClosure />} />
        <Route path="/claims/home/new"                    element={<HomeFNOLWizard />} />
        <Route path="/claims/home/:id/status"             element={<RedirectToSearch />} />
        <Route path="/claims/commercial-auto/new"         element={<CommercialAutoFNOLWizard />} />
        <Route path="/claims/commercial-auto/:id/status"  element={<RedirectToSearch />} />
        <Route path="/claims/:id/status"                  element={<RedirectToSearch />} />
        <Route path="/claims/:id/closure"                 element={<ClaimClosure />} />
        <Route path="*"                                   element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
