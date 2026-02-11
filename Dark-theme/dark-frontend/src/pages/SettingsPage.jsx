"use client"

import { useState } from "react"
import { Save, Upload, Bell, Shield, Palette } from "lucide-react"
import { SidebarNavigation } from "./SidebarNavigation";

export default function SettingsPage() {
  const [userProfile, setUserProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    bio: "Product Manager passionate about productivity and AI",
    avatar: "/placeholder.svg?height=100&width=100",
    timezone: "UTC-5",
    language: "en",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    taskReminders: true,
    weeklyReports: true,
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "24h",
  })

  const [preferences, setPreferences] = useState({
    theme: "light",
    defaultView: "kanban",
    autoSave: true,
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSaveProfile = () => {
    setIsLoading(true)
    console.log("Saving profile:", userProfile)
    // Simulate API call
    setTimeout(() => {
      alert("Profile updated successfully!")
      setIsLoading(false)
    }, 1000)
  }

  const handleAvatarUpload = () => {
    alert("Implement file upload logic here.")
  }

  const handleChangePassword = () => {
    alert("Implement password change form/modal here.")
  }

  const Switch = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${
        checked ? "bg-gradient-to-r from-orange-400 to-pink-400" : "bg-white/10"
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border border-white/20 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black`}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  )

  return (
      <div className="min-h-screen bg-white flex">
                    <SidebarNavigation />
        <div className="min-h-screen bg-black flex-1 font-figtree relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          </div>
    <div className="min-h-screen bg-black">

      <main className="container mx-auto px-4 py-10 max-w-4xl font-figtree">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="grid gap-6">
          <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-orange-400 to-pink-400">
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    JD
                  </span>
                </div>
                Profile Information
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-orange-400 to-pink-400 p-0.5">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-black text-lg font-bold text-white">
                    JD
                  </span>
                </div>
                <button
                  onClick={handleAvatarUpload}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                >
                  <Upload className="h-4 w-4" /> Change Avatar
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="text-sm font-semibold text-white block mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-semibold text-white block mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bio" className="text-sm font-semibold text-white block mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows="3"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="timezone" className="text-sm font-semibold text-white block mb-2">
                    Timezone
                  </label>
                  <select
                    value={userProfile.timezone}
                    onChange={(e) => setUserProfile((prev) => ({ ...prev, timezone: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  >
                    <option value="UTC-8" className="bg-gray-900">
                      Pacific Time (UTC-8)
                    </option>
                    <option value="UTC-5" className="bg-gray-900">
                      Eastern Time (UTC-5)
                    </option>
                    <option value="UTC+0" className="bg-gray-900">
                      GMT (UTC+0)
                    </option>
                  </select>
                </div>
                <div>
                  <label htmlFor="language" className="text-sm font-semibold text-white block mb-2">
                    Language
                  </label>
                  <select
                    value={userProfile.language}
                    onChange={(e) => setUserProfile((prev) => ({ ...prev, language: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  >
                    <option value="en" className="bg-gray-900">
                      English
                    </option>
                    <option value="es" className="bg-gray-900">
                      Spanish
                    </option>
                    <option value="fr" className="bg-gray-900">
                      French
                    </option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 h-10 px-6 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-orange-400/25 transition-all duration-200"
              >
                <Save className="h-4 w-4" /> {isLoading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>

          {[
            {
              title: "Notifications",
              Icon: Bell,
              content: (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div>
                      <label className="font-semibold text-white">Email Notifications</label>
                      <p className="text-sm text-gray-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onChange={(checked) => setNotifications((prev) => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div>
                      <label className="font-semibold text-white">Moodle</label>
                      <p className="text-sm text-gray-400">Include Your moodle Tasks</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onChange={(checked) => setNotifications((prev) => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div>
                      <label className="font-semibold text-white">Task Reminders</label>
                      <p className="text-sm text-gray-400">Get reminded about upcoming deadlines</p>
                    </div>
                    <Switch
                      checked={notifications.taskReminders}
                      onChange={(checked) => setNotifications((prev) => ({ ...prev, taskReminders: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div>
                      <label className="font-semibold text-white">Weekly Reports</label>
                      <p className="text-sm text-gray-400">Receive weekly productivity reports</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onChange={(checked) => setNotifications((prev) => ({ ...prev, weeklyReports: checked }))}
                    />
                  </div>
                </div>
              ),
            },
            {
              title: "Security",
              Icon: Shield,
              content: (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div>
                      <label className="font-semibold text-white">Two-Factor Authentication</label>
                      <p className="text-sm text-gray-400">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={security.twoFactorEnabled}
                      onChange={(checked) => setSecurity((prev) => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <label className="font-semibold text-white block mb-2">Session Timeout</label>
                    <select
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity((prev) => ({ ...prev, sessionTimeout: e.target.value }))}
                      className="w-full h-10 px-3 border border-white/20 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                    >
                      <option value="1h" className="bg-gray-900">
                        1 Hour
                      </option>
                      <option value="8h" className="bg-gray-900">
                        8 Hours
                      </option>
                      <option value="24h" className="bg-gray-900">
                        24 Hours
                      </option>
                      <option value="never" className="bg-gray-900">
                        Never
                      </option>
                    </select>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="w-full h-10 px-4 py-2 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                  >
                    Change Password
                  </button>
                </div>
              ),
            },
            {
              title: "Preferences",
              Icon: Palette,
              content: (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <label className="font-semibold text-white block mb-2">Theme</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, theme: e.target.value }))}
                      className="w-full h-10 px-3 border border-white/20 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                    >
                      <option value="light" className="bg-gray-900">
                        Light
                      </option>
                      <option value="dark" className="bg-gray-900">
                        Dark
                      </option>
                      <option value="system" className="bg-gray-900">
                        System
                      </option>
                    </select>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <label className="font-semibold text-white block mb-2">Default View</label>
                    <select
                      value={preferences.defaultView}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, defaultView: e.target.value }))}
                      className="w-full h-10 px-3 border border-white/20 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                    >
                      <option value="kanban" className="bg-gray-900">
                        Kanban Board
                      </option>
                      <option value="list" className="bg-gray-900">
                        List View
                      </option>
                      <option value="calendar" className="bg-gray-900">
                        Calendar View
                      </option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div>
                      <label className="font-semibold text-white">Auto-save</label>
                      <p className="text-sm text-gray-400">Automatically save changes</p>
                    </div>
                    <Switch
                      checked={preferences.autoSave}
                      onChange={(checked) => setPreferences((prev) => ({ ...prev, autoSave: checked }))}
                    />
                  </div>
                </div>
              ),
            },
          ].map(({ title, Icon, content }) => (
            <div
              key={title}
              className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300"
            >
              <div className="p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Icon className="h-6 w-6" /> {title}
                </h3>
              </div>
              <div className="p-6">{content}</div>
            </div>
          ))}
        </div>
      </main>
</div>
</div>
</div>
  )
}
