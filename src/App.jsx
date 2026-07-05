import { Routes, Route, Outlet } from 'react-router-dom'
import { RequireActive, RequireAdmin, RedirectIfAuthed } from './routes/guards'
import TabBar from './components/TabBar'
import { StatusBar } from './components/Layout'

// Auth / onboarding
import Welcome from './routes/auth/Welcome'
import Register from './routes/auth/Register'
import Login from './routes/auth/Login'
import LoginAdmin from './routes/auth/LoginAdmin'
import Pending from './routes/auth/Pending'
import ChangePassword from './routes/auth/ChangePassword'

// Choriste
import Dashboard from './routes/chorister/Dashboard'
import Feed from './routes/chorister/Feed'
import Songs from './routes/chorister/Songs'
import SongDetail from './routes/chorister/SongDetail'
import Agenda from './routes/chorister/Agenda'
import ChoristOfMonth from './routes/chorister/ChoristOfMonth'
import Messages from './routes/chorister/Messages'
import Chat from './routes/chorister/Chat'
import Notifications from './routes/chorister/Notifications'
import Profile from './routes/chorister/Profile'
import Presence from './routes/chorister/Presence'
import MemberPublic from './routes/chorister/MemberPublic'
import Reglement from './routes/chorister/Reglement'
import Help from './routes/chorister/Help'

// Admin
import AdminHome from './routes/admin/AdminHome'
import ValidateAccounts from './routes/admin/ValidateAccounts'
import Announcement from './routes/admin/Announcement'
import AdminAnnouncements from './routes/admin/AdminAnnouncements'
import EventForm from './routes/admin/EventForm'
import ChoristOfMonthAdmin from './routes/admin/ChoristOfMonthAdmin'
import SongsAdmin from './routes/admin/SongsAdmin'
import SongEditor from './routes/admin/SongEditor'
import Members from './routes/admin/Members'
import Stats from './routes/admin/Stats'
import Invitations from './routes/admin/Invitations'
import ReglementAdmin from './routes/admin/ReglementAdmin'
import ReglementEditor from './routes/admin/ReglementEditor'
import Bureau from './routes/admin/Bureau'
import BureauEditor from './routes/admin/BureauEditor'

/** Coquille choriste avec barre d'onglets persistante. */
function ChoristerShell() {
  return (
    <div className="screen" style={{ background: 'var(--app-bg)' }}>
      <StatusBar />
      <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* --- Auth --- */}
      <Route path="/" element={<RedirectIfAuthed><Welcome /></RedirectIfAuthed>} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/admin/login" element={<RedirectIfAuthed><LoginAdmin /></RedirectIfAuthed>} />
      <Route path="/pending" element={<Pending />} />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* --- Choriste : onglets principaux (barre visible) --- */}
      <Route element={<RequireActive><ChoristerShell /></RequireActive>}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/songs" element={<Songs />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* --- Choriste : écrans empilés (plein écran) --- */}
      <Route element={<RequireActive><Outlet /></RequireActive>}>
        <Route path="/songs/:id" element={<SongDetail />} />
        <Route path="/chorist-of-month" element={<ChoristOfMonth />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:id" element={<Chat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/presence" element={<Presence />} />
        <Route path="/members/:id" element={<MemberPublic />} />
        <Route path="/reglement" element={<Reglement />} />
        <Route path="/help" element={<Help />} />
      </Route>

      {/* --- Admin --- */}
      <Route element={<RequireAdmin><Outlet /></RequireAdmin>}>
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/accounts" element={<ValidateAccounts />} />
        <Route path="/admin/announcement" element={<Announcement />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/admin/event" element={<EventForm />} />
        <Route path="/admin/chorist-of-month" element={<ChoristOfMonthAdmin />} />
        <Route path="/admin/songs" element={<SongsAdmin />} />
        <Route path="/admin/songs/new" element={<SongEditor />} />
        <Route path="/admin/songs/:id" element={<SongEditor />} />
        <Route path="/admin/members" element={<Members />} />
        <Route path="/admin/stats" element={<Stats />} />
        <Route path="/admin/invitations" element={<Invitations />} />
        <Route path="/admin/reglement" element={<ReglementAdmin />} />
        <Route path="/admin/reglement/new" element={<ReglementEditor />} />
        <Route path="/admin/reglement/:id" element={<ReglementEditor />} />
        <Route path="/admin/bureau" element={<Bureau />} />
        <Route path="/admin/bureau/new" element={<BureauEditor />} />
        <Route path="/admin/bureau/:id" element={<BureauEditor />} />
      </Route>
    </Routes>
  )
}
