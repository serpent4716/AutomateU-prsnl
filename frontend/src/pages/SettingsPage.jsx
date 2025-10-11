import React, { useState, useEffect } from "react";
import { Save, Upload, Bell, Shield, Palette } from "lucide-react";

// Placeholder for Header component as its code was not provided
const Header = () => (
    <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto">
            <h1 className="text-xl font-bold">App Header</h1>
        </div>
    </header>
);

export default function SettingsPage() {
    const [userProfile, setUserProfile] = useState({
        name: "John Doe",
        email: "john.doe@example.com",
        bio: "Product Manager passionate about productivity and AI",
        avatar: "/placeholder.svg?height=100&width=100",
        timezone: "UTC-5",
        language: "en",
    });

    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: false,
        taskReminders: true,
        weeklyReports: true,
    });

    const [security, setSecurity] = useState({
        twoFactorEnabled: false,
        sessionTimeout: "24h",
    });

    const [preferences, setPreferences] = useState({
        theme: "light",
        defaultView: "kanban",
        autoSave: true,
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleSaveProfile = () => {
        setIsLoading(true);
        console.log("Saving profile:", userProfile);
        // Simulate API call
        setTimeout(() => {
            alert("Profile updated successfully!");
            setIsLoading(false);
        }, 1000);
    };

    const handleAvatarUpload = () => {
        alert("Implement file upload logic here.");
    };
    
    const handleChangePassword = () => {
        alert("Implement password change form/modal here.");
    };

    // Reusable Switch Component for JSX
    const Switch = ({ checked, onChange }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`${
                checked ? 'bg-black' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
        >
            <span
                aria-hidden="true"
                className={`${
                    checked ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account and preferences</p>
                </div>

                <div className="grid gap-6">
                    {/* Profile Settings */}
                    <div className="rounded-lg border bg-white text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                                <div className="relative flex h-6 w-6 shrink-0 overflow-hidden rounded-full">
                                    <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">JD</span>
                                </div>
                                Profile Information
                            </h3>
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full">
                                     <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-lg">JD</span>
                                </div>
                                <button onClick={handleAvatarUpload} className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent">
                                    <Upload className="h-4 w-4" /> Change Avatar
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium leading-none">Full Name</label>
                                    <input id="name" value={userProfile.name} onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                                    <input id="email" type="email" value={userProfile.email} onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="bio" className="text-sm font-medium leading-none">Bio</label>
                                <textarea id="bio" value={userProfile.bio} onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell us about yourself..." rows="3" className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="timezone" className="text-sm font-medium leading-none">Timezone</label>
                                    <select value={userProfile.timezone} onChange={e => setUserProfile(prev => ({...prev, timezone: e.target.value}))} className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="UTC-8">Pacific Time (UTC-8)</option>
                                        <option value="UTC-5">Eastern Time (UTC-5)</option>
                                        <option value="UTC+0">GMT (UTC+0)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="language" className="text-sm font-medium leading-none">Language</label>
                                    <select value={userProfile.language} onChange={e => setUserProfile(prev => ({...prev, language: e.target.value}))} className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleSaveProfile} disabled={isLoading} className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-black text-white rounded-md text-sm font-medium disabled:bg-gray-400">
                                <Save className="h-4 w-4" /> {isLoading ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    </div>
                    
                    {/* Other Sections */}
                    {[{
                        title: "Notifications",
                        Icon: Bell,
                        content: (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Email Notifications</label><p className="text-sm text-gray-600">Receive notifications via email</p></div>
                                    <Switch checked={notifications.emailNotifications} onChange={checked => setNotifications(prev => ({...prev, emailNotifications: checked}))} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Moodle</label><p className="text-sm text-gray-600">Include Your moodle Tasks</p></div>
                                    <Switch checked={notifications.pushNotifications} onChange={checked => setNotifications(prev => ({...prev, pushNotifications: checked}))} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Task Reminders</label><p className="text-sm text-gray-600">Get reminded about upcoming deadlines</p></div>
                                    <Switch checked={notifications.taskReminders} onChange={checked => setNotifications(prev => ({...prev, taskReminders: checked}))} />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Weekly Reports</label><p className="text-sm text-gray-600">Receive weekly productivity reports</p></div>
                                    <Switch checked={notifications.weeklyReports} onChange={checked => setNotifications(prev => ({...prev, weeklyReports: checked}))} />
                                </div>
                            </div>
                        )
                    }, {
                        title: "Security",
                        Icon: Shield,
                        content: (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Two-Factor Authentication</label><p className="text-sm text-gray-600">Add an extra layer of security</p></div>
                                    <Switch checked={security.twoFactorEnabled} onChange={checked => setSecurity(prev => ({...prev, twoFactorEnabled: checked}))} />
                                </div>
                                <div>
                                    <label className="font-medium">Session Timeout</label>
                                    <select value={security.sessionTimeout} onChange={e => setSecurity(prev => ({...prev, sessionTimeout: e.target.value}))} className="mt-1 w-full h-10 px-3 border rounded-md bg-white">
                                        <option value="1h">1 Hour</option><option value="8h">8 Hours</option><option value="24h">24 Hours</option><option value="never">Never</option>
                                    </select>
                                </div>
                                <button onClick={handleChangePassword} className="h-10 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent">Change Password</button>
                            </div>
                        )
                    }, {
                       title: "Preferences",
                       Icon: Palette,
                       content: (
                            <div className="space-y-4">
                                <div>
                                    <label className="font-medium">Theme</label>
                                    <select value={preferences.theme} onChange={e => setPreferences(prev => ({...prev, theme: e.target.value}))} className="mt-1 w-full h-10 px-3 border rounded-md bg-white">
                                        <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
                                    </select>
                                </div>
                                 <div>
                                    <label className="font-medium">Default View</label>
                                    <select value={preferences.defaultView} onChange={e => setPreferences(prev => ({...prev, defaultView: e.target.value}))} className="mt-1 w-full h-10 px-3 border rounded-md bg-white">
                                        <option value="kanban">Kanban Board</option><option value="list">List View</option><option value="calendar">Calendar View</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Auto-save</label><p className="text-sm text-gray-600">Automatically save changes</p></div>
                                    <Switch checked={preferences.autoSave} onChange={checked => setPreferences(prev => ({...prev, autoSave: checked}))} />
                                </div>
                            </div>
                       )
                    }].map(({ title, Icon, content }) => (
                         <div key={title} className="rounded-lg border bg-white text-card-foreground shadow-sm">
                            <div className="p-6">
                                <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2"><Icon className="h-5 w-5" /> {title}</h3>
                            </div>
                            <div className="p-6 pt-0">{content}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}