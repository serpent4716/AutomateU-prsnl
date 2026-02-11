"use client"

import React, { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import {
  Save,
  Upload,
  Bell,
  Shield,
  Palette,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react"
import api from "../services/api"
import { SidebarNavigation } from "./SidebarNavigation"
 // keep any component CSS you rely on
import { ThemeContext } from "../context/ThemeContext" // ensure this exists in your app

// ---------- Reusable Modal ----------
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-gradient-to-br from-white/5 to-white/3 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 text-white">{children}</div>
      </div>
    </div>
  )
}

// ---------- Switch Component ----------
const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`${checked ? "bg-black" : "bg-white/10"
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
  >
    <span
      aria-hidden="true"
      className={`${checked ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out`}
    />
  </button>
)

// ---------- Moodle Modal (create / update) ----------
const MoodleModal = ({ hasAccount, onSave, onClose }) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [batch, setBatch] = useState("")
  const [autoSync, setAutoSync] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (hasAccount) {
      setIsLoading(true)
      api
        .get("/moodle/account")
        .then((res) => {
          const d = res.data || {}
          setUsername(d.username || "")
          setBatch(d.batch || "")
          setAutoSync(Boolean(d.auto_sync))
        })
        .catch((err) => {
          console.error("Error fetching Moodle account:", err)
          setError("Could not load your Moodle details.")
        })
        .finally(() => setIsLoading(false))
    }
  }, [hasAccount])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!password) {
      setError("Password is required to save changes.")
      return
    }

    setIsLoading(true)
    const payload = {
      username,
      batch,
      auto_sync: autoSync,
    }
    if (password) payload.password = password

    try {
      const call = hasAccount ? api.put("/moodle/account", payload) : api.post("/moodle/account", payload)
      const response = await call
      onSave(response.data)
      onClose()
    } catch (err) {
      console.error("Moodle save failed:", err)
      setError(err.response?.data?.detail || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div>
        <label className="text-sm font-medium">Moodle Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-400"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Batch (e.g., B1, B2)</label>
        <input
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-400"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Moodle Password</label>
        {hasAccount && <p className="text-xs text-gray-400">Please re-enter your password to save changes.</p>}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-400"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="font-medium">Auto-Sync</label>
          <p className="text-xs text-gray-400">Automatically sync your Moodle tasks.</p>
        </div>
        <Switch checked={autoSync} onChange={setAutoSync} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onClose} className="h-10 px-4 border rounded-md text-sm text-white/80">Cancel</button>
        <button type="submit" disabled={isLoading} className="h-10 px-4 bg-black text-white rounded-md text-sm">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
          {isLoading ? "Saving..." : (hasAccount ? "Update Account" : "Create Account")}
        </button>
      </div>
    </form>
  )
}

// ---------- Password Modal ----------
const PasswordModal = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.")
      return
    }

    setIsLoading(true)
    try {
      await api.put("/users/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      })
      console.log("Password updated successfully!")
      onClose()
    } catch (err) {
      console.error("Password change failed:", err)
      setError(err.response?.data?.detail || "An error occurred. Please check your current password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div>
        <label className="text-sm font-medium">Current Password</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
      </div>
      <div>
        <label className="text-sm font-medium">New Password</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
        <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters long.</p>
      </div>
      <div>
        <label className="text-sm font-medium">Confirm New Password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onClose} className="h-10 px-4 border rounded-md text-sm text-white/80">Cancel</button>
        <button type="submit" disabled={isLoading} className="h-10 px-4 bg-black text-white rounded-md text-sm">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isLoading ? "Saving..." : "Change Password"}
        </button>
      </div>
    </form>
  )
}

// ---------- Coming Soon Modal ----------
const ComingSoonModal = ({ onClose }) => (
  <div>
    <p className="text-gray-300">This feature will be implemented soon. Stay tuned!</p>
    <div className="flex justify-end pt-4">
      <button onClick={onClose} className="h-10 px-4 bg-black text-white rounded-md text-sm">Got it</button>
    </div>
  </div>
)

// ---------- Main Settings Page (dark UI with full backend) ----------
export default function SettingsPage({ userInfo, setUserInfo }) {
  const navigate = useNavigate()
  const { updateTheme } = useContext(ThemeContext || {}) // guard if missing
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    timezone: "UTC",
    language: "en",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    moodleAutoSync: false,
    taskReminders: true,
    weeklyReports: true,
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "24h",
  })

  const [preferences, setPreferences] = useState({
    theme: "dark",
    autoSave: true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState(null) // 'moodle' | 'password' | 'comingSoon'
  const [hasMoodleAccount, setHasMoodleAccount] = useState(false)
  const [isMoodleCheckLoading, setIsMoodleCheckLoading] = useState(true)
  const [updateError, setUpdateError] = useState(null)

  const categories = ["Electronics", "Personal Items", "Bags", "Clothing", "Books", "Jewelry", "Keys", "Other"]

  // Populate profile from userInfo when available
  useEffect(() => {
    if (!userInfo) {
      // If user not logged in, optionally redirect
      // navigate("/login")
      return
    }
    setUserProfile({
      name: userInfo.name || "",
      email: userInfo.email || "",
      timezone: userInfo.timezone || "UTC",
      language: userInfo.language || "en",
    })
  }, [userInfo])

  // Check Moodle account existence on load
  useEffect(() => {
    if (!userInfo) {
      setIsMoodleCheckLoading(false)
      return
    }
    setIsMoodleCheckLoading(true)
    api
      .get("/moodle/account")
      .then((res) => {
        setHasMoodleAccount(true)
        setNotifications((prev) => ({ ...prev, moodleAutoSync: Boolean(res.data.auto_sync) }))
      })
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          setHasMoodleAccount(false)
          setNotifications((prev) => ({ ...prev, moodleAutoSync: false }))
        } else {
          console.error("Error checking Moodle account:", err)
        }
      })
      .finally(() => setIsMoodleCheckLoading(false))
  }, [userInfo])

  // Save profile handler (PUT /users/update)
  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const updateData = {
        name: userProfile.name,
        email: userProfile.email,
        timezone: userProfile.timezone,
        language: userProfile.language,
      }
      const res = await api.put("/users/update", updateData)
      // Update global app user info
      if (typeof setUserInfo === "function") setUserInfo(res.data)
      setUserProfile({
        name: res.data.name || "",
        email: res.data.email || "",
        timezone: res.data.timezone || "UTC",
        language: res.data.language || "en",
      })
      console.log("Profile updated successfully!")
    } catch (err) {
      console.error("Failed to update profile:", err)
      setUpdateError("Failed to update profile. Please try again.")
      setTimeout(() => setUpdateError(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = () => {
    // TODO: implement file upload endpoint and form handling
    console.log("Avatar upload clicked - implement file upload logic")
  }

  const openModal = (type) => {
    setModalContent(type)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setModalContent(null)
    setIsModalOpen(false)
  }

  const handleMoodleSave = (accountData) => {
    setHasMoodleAccount(true)
    setNotifications((prev) => ({ ...prev, moodleAutoSync: Boolean(accountData.auto_sync) }))
  }

  const handleTaskReminderChange = (checked) => {
    setNotifications((prev) => ({ ...prev, taskReminders: checked }))
    if (checked && !notifications.emailNotifications) {
      console.warn("Task reminders require email notifications to be enabled.")
    }
  }

  const handleThemeChange = (e) => {
    const newTheme = e.target.value
    setPreferences((prev) => ({ ...prev, theme: newTheme }))
    if (typeof updateTheme === "function") updateTheme(newTheme)
  }

  // Modal title logic
  let modalTitle = ""
  if (modalContent === "moodle") modalTitle = hasMoodleAccount ? "Update Moodle Account" : "Link Moodle Account"
  else if (modalContent === "password") modalTitle = "Change Password"
  else if (modalContent === "comingSoon") modalTitle = "Feature Coming Soon"

  return (
    <div className="relative min-h-screen font-sans overflow-hidden bg-black">
      <div className="min-h-screen flex">
        <SidebarNavigation />
        <main className="container mx-auto px-4 py-10 max-w-4xl flex-1">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>

          {updateError && (
            <div className="mb-4 p-3 rounded-md bg-red-900/20 border border-red-800/30 text-red-200 flex justify-between items-center shadow-sm" role="alert">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{updateError}</span>
              </div>
              <button onClick={() => setUpdateError(null)} className="p-1 rounded-full hover:bg-red-800/20" aria-label="Dismiss error">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="grid gap-6">
            {/* Profile Card */}
            <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg transition-all duration-300">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-orange-400 to-pink-400 p-0.5">
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                      {userProfile.name ? userProfile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U"}
                    </span>
                  </div>
                  Profile Information
                </h3>
                <button onClick={handleAvatarUpload} className="inline-flex items-center gap-2 h-10 px-4 py-2 border rounded-md text-sm text-white hover:bg-white/5">
                  <Upload className="h-4 w-4" /> Change Avatar
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-white block mb-2">Full Name</label>
                    <input value={userProfile.name} onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))} className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white block mb-2">Email</label>
                    <input type="email" value={userProfile.email} onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))} className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-white block mb-2">Timezone</label>
                    <select value={userProfile.timezone} onChange={(e) => setUserProfile(prev => ({ ...prev, timezone: e.target.value }))} className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                      <option value="UTC-8">Pacific Time (UTC-8)</option>
                      <option value="UTC-5">Eastern Time (UTC-5)</option>
                      <option value="UTC">GMT (UTC+0)</option>
                      <option value="UTC+5:30">India (UTC+5:30)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white block mb-2">Language</label>
                    <select value={userProfile.language} onChange={(e) => setUserProfile(prev => ({ ...prev, language: e.target.value }))} className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={handleSaveProfile} disabled={isLoading} className="inline-flex items-center gap-2 h-10 px-6 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isLoading ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications / Security / Preferences cards */}
            <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg transition-all duration-300 p-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Bell className="h-5 w-5" /> Notifications</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <label className="font-semibold text-white">Email Notifications</label>
                    <p className="text-sm text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch checked={notifications.emailNotifications} onChange={(c) => setNotifications(prev => ({ ...prev, emailNotifications: c }))} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <label className="font-semibold text-white">Moodle</label>
                    <p className="text-sm text-gray-400">Manage Moodle account and sync</p>
                  </div>
                  {isMoodleCheckLoading ? (
                    <div className="flex items-center justify-center h-6 w-11">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <Switch checked={notifications.moodleAutoSync} onChange={() => openModal("moodle")} />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <label className="font-semibold text-white">Task Reminders</label>
                    <p className="text-sm text-gray-400">Get reminded about upcoming deadlines</p>
                  </div>
                  <Switch checked={notifications.taskReminders} onChange={handleTaskReminderChange} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <label className="font-semibold text-white">Weekly Reports</label>
                    <p className="text-sm text-gray-400">Receive weekly productivity reports</p>
                  </div>
                  <Switch checked={notifications.weeklyReports} onChange={() => openModal("comingSoon")} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg transition-all duration-300 p-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Shield className="h-5 w-5" /> Security</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <label className="font-semibold text-white">Two-Factor Authentication</label>
                    <p className="text-sm text-gray-400">Add an extra layer of security</p>
                  </div>
                  <Switch checked={security.twoFactorEnabled} onChange={() => openModal("comingSoon")} />
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <label className="font-semibold text-white block mb-2">Session Timeout</label>
                  <select value={security.sessionTimeout} onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: e.target.value }))} className="w-full h-10 rounded-md border border-white/10 bg-white/5 text-white px-3">
                    <option value="1h">1 Hour</option>
                    <option value="8h">8 Hours</option>
                    <option value="24h">24 Hours</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <button onClick={() => openModal("password")} className="w-full h-10 px-4 py-2 border border-white/10 rounded-md text-sm text-white hover:bg-white/5">Change Password</button>
              </div>
            </div>

            <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg transition-all duration-300 p-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Palette className="h-5 w-5" /> Preferences</h3>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <label className="font-semibold text-white block mb-2">Theme</label>
                  <select value={preferences.theme} onChange={handleThemeChange} className="w-full h-10 rounded-md border border-white/10 bg-white/5 text-white px-3">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <label className="font-semibold text-white block mb-2">Auto-save</label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Automatically save changes</p>
                    <Switch checked={preferences.autoSave} onChange={(c) => setPreferences(prev => ({ ...prev, autoSave: c }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modals */}
          <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
            {modalContent === "moodle" && <MoodleModal hasAccount={hasMoodleAccount} onSave={handleMoodleSave} onClose={closeModal} />}
            {modalContent === "password" && <PasswordModal onClose={closeModal} />}
            {modalContent === "comingSoon" && <ComingSoonModal onClose={closeModal} />}
          </Modal>
        </main>
      </div>
    </div>
  )
}
