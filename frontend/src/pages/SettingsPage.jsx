import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom"; 
import { Save, Upload, Bell, Shield, Palette, X, Loader2 } from "lucide-react";
import api from "../services/api"; 
import { SidebarNavigation } from "./SidebarNavigation"; 
import { useTheme } from '../context/ThemeContext';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()} // Prevent click-through
            >
                <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
};

// --- Reusable Switch Component ---
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


// --- Modal Content: Moodle Account ---
const MoodleModal = ({ hasAccount, onSave, onClose }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [batch, setBatch] = useState("");
    const [autoSync, setAutoSync] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load existing data if user has an account
    useEffect(() => {
        if (hasAccount) {
            setIsLoading(true);
            api.get("/moodle/account")
                .then(response => {
                    const { username, batch, auto_sync } = response.data;
                    setUsername(username || "");
                    setBatch(batch || "");
                    setAutoSync(auto_sync);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching Moodle account:", err);
                    setError("Could not load your Moodle details.");
                    setIsLoading(false);
                });
        }
    }, [hasAccount]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const data = {
            username,
            batch,
            auto_sync: autoSync,
        };
        
        // Only include password if it's being set or changed
        if (password) {
            data.password = password;
        }
        
        // --- MODIFICATION ---
        // If the account exists and the password is blank (which it shouldn't be, due to 'required'
        // but as a safety check), we still need to handle it.
        // The 'required' attribute on the input is the primary fix.
        // We'll also add a check here just in case.
        if (!password) {
             setError("Password is required to save changes.");
             setIsLoading(false);
             return;
        }
        // --- END MODIFICATION ---

        const apiCall = hasAccount 
            ? api.put("/moodle/account", data)  // PUT for update
            : api.post("/moodle/account", data); // POST for create

        try {
            const response = await apiCall;
            onSave(response.data); // Pass new account data back to parent
            onClose();
        } catch (err) {
            console.error("Moodle save failed:", err);
            setError(err.response?.data?.detail || "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Show main loader only on initial data fetch (when hasAccount is false)
    if (isLoading && hasAccount) {
         // If we have an account, we show a loader *inside* the form, not replacing it
         // But the useEffect handles its own loading state for population.
         // Let's adjust the button disabled state instead.
         // The loader for form population is handled by disabling the submit button.
    }
    
    // This loader is for when we are fetching existing data
    if (isLoading && hasAccount && !username) {
         return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
                <label htmlFor="moodle-username" className="text-sm font-medium leading-none">Moodle Username</label>
                <input id="moodle-username" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
             <div>
                <label htmlFor="moodle-batch" className="text-sm font-medium leading-none">Batch (e.g., B1, B2)</label>
                <input id="moodle-batch" value={batch} onChange={(e) => setBatch(e.target.value)} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
                <label htmlFor="moodle-password" className="text-sm font-medium leading-none">Moodle Password</label>
                {/* --- MODIFIED: Changed helper text to reflect new requirement --- */}
                {hasAccount && <p className="text-xs text-gray-500">Please re-enter your password to save changes.</p>}
                {/* --- MODIFIED: Changed required={!hasAccount} to just required --- */}
                <input id="moodle-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            
            <div className="flex items-center justify-between">
                <div>
                    <label className="font-medium">Auto-Sync</label>
                    <p className="text-sm text-gray-600">Automatically sync your Moodle tasks.</p>
                </div>
                <Switch checked={autoSync} onChange={setAutoSync} />
            </div>
            <p className="text-xs text-gray-500 -mt-2">
                Data is fetched every 15 minutes, so it may take time to reflect on the task dashboard.
            </p>

            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="h-10 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent">
                    Cancel
                </button>
                 <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-black text-white rounded-md text-sm font-medium disabled:bg-gray-400">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isLoading ? "Saving..." : (hasAccount ? "Update Account" : "Create Account")}
                </button>
            </div>
        </form>
    );
};

// --- Modal Content: Change Password ---
const PasswordModal = ({ onClose }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        
        // --- ADDED: Password length validation ---
        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters long.");
            return;
        }
        // --- END: Password length validation ---
        
        setIsLoading(true);
        
        try {
            // NOTE: Update this endpoint to your actual password change endpoint
            await api.put("/users/change-password", {
                current_password: currentPassword,
                new_password: newPassword,
            });
            // Changed alert to a non-blocking console log or a success message
            console.log("Password updated successfully!");
            onClose();
        } catch (err) {
             console.error("Password change failed:", err);
             setError(err.response?.data?.detail || "An error occurred. Please check your current password.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
                <label htmlFor="current-pass" className="text-sm font-medium leading-none">Current Password</label>
                <input id="current-pass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
             <div>
                <label htmlFor="new-pass" className="text-sm font-medium leading-none">New Password</label>
                <input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                {/* --- ADDED: Helper text for password length --- */}
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long.</p>
            </div>
             <div>
                <label htmlFor="confirm-pass" className="text-sm font-medium leading-none">Confirm New Password</label>
                <input id="confirm-pass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="h-10 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent">
                    Cancel
                </button>
                 <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-black text-white rounded-md text-sm font-medium disabled:bg-gray-400">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isLoading ? "Saving..." : "Change Password"}
                </button>
            </div>
        </form>
    );
};

// --- Modal Content: "Coming Soon" ---
const ComingSoonModal = ({ onClose }) => (
    <div>
        <p className="text-gray-600">This feature will be implemented soon. Stay tuned!</p>
        <div className="flex justify-end pt-4">
             <button onClick={onClose} className="h-10 px-4 py-2 bg-black text-white rounded-md text-sm font-medium">
                Got it
            </button>
        </div>
    </div>
);


// --- Main Settings Page Component ---

export default function SettingsPage({ userInfo, setUserInfo }) {
    
    const navigate = useNavigate();

    // Initialize state with defaults
    const [userProfile, setUserProfile] = useState({
        name: "",
        email: "",
        timezone: "UTC",
        language: "en",
    });

    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        moodleAutoSync: false,
        taskReminders: true,
        weeklyReports: true,
    });

    const [security, setSecurity] = useState({
        twoFactorEnabled: false,
        sessionTimeout: "24h",
    });


    const [isLoading, setIsLoading] = useState(false); // For profile save
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null); // 'moodle', 'password', 'comingSoon'
    const [hasMoodleAccount, setHasMoodleAccount] = useState(false);
    // --- ADDED: Loading state for initial Moodle check ---
    const [isMoodleCheckLoading, setIsMoodleCheckLoading] = useState(true);

    
    const { updateTheme, preference } = useTheme(); 
// Note: preference here is 'light', 'dark', or 'system'
    const [preferences, setPreferences] = useState({ 
        theme: preference, 
    });

const handleThemeChange = (e) => {
    const newPreference = e.target.value;
    
    // update local settings page UI
    setPreferences(prev => ({ ...prev, theme: newPreference })); // Make sure 'theme' field in preferences stores the preference ('light', 'dark', or 'system')
    
    // update global theme using the function provided by ThemeProvider
    updateTheme(newPreference);
};
    // --- Effects ---

    // 1. Auth Check and State Population
    useEffect(() => {
        if (!userInfo) {
            // If userInfo is null/undefined, redirect to login
            console.log("No user info, redirecting to login");
            // navigate("/login"); // Mock navigation
        } else {
            // If userInfo exists, populate the profile state
            setUserProfile({
                name: userInfo.name || "",
                email: userInfo.email || "",
                timezone: userInfo.timezone || "UTC", // Fallback to default
                language: userInfo.language || "en",   // Fallback to default
            });
            // You could also fetch and set notification/security preferences here
        }
    }, [userInfo, navigate]);

    // 2. Fetch Moodle Account Status on Load
    useEffect(() => {
        // Only run if the user is logged in
        if (userInfo) {
            setIsMoodleCheckLoading(true); // --- MODIFIED: Set loading true
            api.get("/moodle/account")
                .then(response => {
                    // User has an account
                    setHasMoodleAccount(true);
                    setNotifications(prev => ({
                        ...prev,
                        moodleAutoSync: response.data.auto_sync
                    }));
                })
                .catch(error => {
                    // User does not have an account
                    if (error.response && error.response.status === 404) {
                        setHasMoodleAccount(false);
                        setNotifications(prev => ({ ...prev, moodleAutoSync: false }));
                    } else {
                        console.error("Error checking Moodle account:", error);
                    }
                })
                .finally(() => {
                    setIsMoodleCheckLoading(false); // --- MODIFIED: Set loading false
                });
        } else {
            setIsMoodleCheckLoading(false); // --- MODIFIED: Set loading false if no user
        }
    }, [userInfo]); // Re-run if userInfo changes


    // --- Handlers ---

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            // Your update endpoint (e.g., PUT /users/me)
            // Send only the fields that can be updated
            const updateData = {
                name: userProfile.name,
                email: userProfile.email,
                timezone: userProfile.timezone,
                language: userProfile.language,
            };
            const response = await api.put("/users/update", updateData);
            
            // Update the global state with the new user info
            setUserInfo(response.data); 
            
            // Update local state just in case
            setUserProfile({
                name: response.data.name || "",
                email: response.data.email || "",
                timezone: response.data.timezone || "UTC",
                language: response.data.language || "en",
            });
            
            // alert("Profile updated successfully!"); // Avoid alerts
            console.log("Profile updated successfully!");
        } catch (err) {
            console.error("Failed to update profile:", err);
            // alert("Error: Could not update profile."); // Avoid alerts
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = () => {
        // TODO: Implement file upload logic
        console.log("Implement file upload logic here.");
    };

    const openModal = (content) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    const handleMoodleSave = (accountData) => {
        // After modal saves (create or update), update main page state
        setHasMoodleAccount(true);
        setNotifications(prev => ({
            ...prev,
            moodleAutoSync: accountData.auto_sync
        }));
        // Optional: Trigger an immediate sync
        // api.post("/tasks/moodle").catch(err => console.error("Initial sync failed", err));
    };
    
    const handleTaskReminderChange = (checked) => {
        setNotifications(prev => ({ ...prev, taskReminders: checked }));
        if (checked && !notifications.emailNotifications) {
            // Consider a less intrusive notification, like a small text warning
            console.warn("Task reminders require email notifications to be enabled.");
        }
    };
    
    // const handleThemeChange = (e) => {
    //     const newTheme = e.target.value;
    //     if (newTheme === 'dark' || newTheme === 'system') {
    //         openModal('comingSoon');
    //         // Don't update state, so dropdown snaps back to "light"
    //     } else {
    //         setPreferences(prev => ({ ...prev, theme: newTheme }));
    //     }
    // };

    // --- Modal Title Logic ---
    let modalTitle = "";
    if (modalContent === 'moodle') {
        modalTitle = hasMoodleAccount ? "Update Moodle Account" : "Link Moodle Account";
    } else if (modalContent === 'password') {
        modalTitle = "Change Password";
    } else if (modalContent === 'comingSoon') {
        modalTitle = "Feature Coming Soon";
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
            <SidebarNavigation />

            <main className="container mx-auto px-4 py-6 max-w-4xl flex-1">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
                </div>

                <div className="grid gap-6">
                    {/* Profile Settings */}
                    <div className="rounded-lg border bg-white text-card-foreground shadow-sm dark:bg-gray-900 dark:border-gray-800">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                                <div className="relative flex h-6 w-6 shrink-0 overflow-hidden rounded-full">
                                    <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                                        {/* Use initials from userProfile state */}
                                        {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                </div>
                                Profile Information
                            </h3>
                        </div>
                        <div className="p-6 pt-0 space-y-4 dark:text-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full">
                                     <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-lg">
                                        {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                                     </span>
                                </div>
                                <button onClick={handleAvatarUpload} className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent dark:border-gray-700 dark:hover:bg-gray-800">
                                    <Upload className="h-4 w-4" /> Change Avatar
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium leading-none">Full Name</label>
                                    <input id="name" value={userProfile.name} onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                                    <input id="email" type="email" value={userProfile.email} onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100" />
                                </div>
                            </div>

                            {/* Bio field is removed */}

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="timezone" className="text-sm font-medium leading-none">Timezone</label>
                                    <select value={userProfile.timezone} onChange={e => setUserProfile(prev => ({...prev, timezone: e.target.value}))} className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100">
                                        <option value="UTC-8">Pacific Time (UTC-8)</option>
                                        <option value="UTC-5">Eastern Time (UTC-5)</option>
                                        <option value="UTC">GMT (UTC+0)</option>
                                        <option value="UTC+5:30">India (UTC+5:30)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="language" className="text-sm font-medium leading-none">Language</label>
                                    <select value={userProfile.language} onChange={e => setUserProfile(prev => ({...prev, language: e.target.value}))} className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100">
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleSaveProfile} disabled={isLoading} className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-black text-white rounded-md text-sm font-medium disabled:bg-gray-400">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isLoading ? "Saving..." : "Save Profile"}
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
                                    <div><label className="font-medium">Moodle</label><p className="text-sm text-gray-600">Manage Moodle account and sync</p></div>
                                    {/* --- MODIFIED: Show loader while checking status --- */}
                                    {isMoodleCheckLoading ? (
                                        <div className="flex h-6 w-11 items-center justify-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        </div>
                                    ) : (
                                        <Switch checked={notifications.moodleAutoSync} onChange={() => openModal('moodle')} />
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Task Reminders</label><p className="text-sm text-gray-600">Get reminded about upcoming deadlines</p></div>
                                    {/* Use custom handler for alert logic */}
                                    <Switch checked={notifications.taskReminders} onChange={handleTaskReminderChange} />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Weekly Reports</label><p className="text-sm text-gray-600">Receive weekly productivity reports</p></div>
                                    {/* Open "Coming Soon" modal */}
                                    <Switch checked={notifications.weeklyReports} onChange={() => openModal('comingSoon')} />
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
                                    {/* Open "Coming Soon" modal */}
                                    <Switch checked={security.twoFactorEnabled} onChange={() => openModal('comingSoon')} />
                                </div>
                                <div>
                                    <label className="font-medium">Session Timeout</label>
                                    <select value={security.sessionTimeout} onChange={e => setSecurity(prev => ({...prev, sessionTimeout: e.target.value}))} className="mt-1 w-full h-10 px-3 border rounded-md bg-white">
                                        <option value="1h">1 Hour</option><option value="8h">8 Hours</option><option value="24h">24 Hours</option><option value="never">Never</option>
                                    </select>
                                </div>
                                {/* Open password change modal */}
                                <button onClick={() => openModal('password')} className="h-10 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent">Change Password</button>
                            </div>
                        )
                    }, {
                       title: "Preferences",
                       Icon: Palette,
                       content: (
                            <div className="space-y-4">
                                <div>
    <label className="font-medium">Theme</label>
    <select 
        // Use the preference state from your local component or context if needed
        value={preferences.theme} 
        onChange={handleThemeChange} 
        className="mt-1 w-full h-10 px-3 border rounded-md bg-white"
    >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
    </select>
</div>
                                {/* "Default View" section is removed */}
                                <div className="flex items-center justify-between">
                                    <div><label className="font-medium">Auto-save</label><p className="text-sm text-gray-600">Automatically save changes</p></div>
                                    <Switch checked={preferences.autoSave} onChange={checked => setPreferences(prev => ({...prev, autoSave: checked}))} />
                                </div>
                            </div>
                       )
                    }].map(({ title, Icon, content }) => (
                         <div key={title} className="rounded-lg border bg-white text-card-foreground shadow-sm dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200">
                            <div className="p-6">
                                <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2"><Icon className="h-5 w-5" /> {title}</h3>
                            </div>
                            <div className="p-6 pt-0">{content}</div>
                        </div>
                    ))}
                </div>
            </main>
            
            {/* --- Modal Rendering Logic --- */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
                {modalContent === 'moodle' && (
                    <MoodleModal
                        hasAccount={hasMoodleAccount}
                        onSave={handleMoodleSave}
                        onClose={closeModal}
                    />
                )}
                {modalContent === 'password' && <PasswordModal onClose={closeModal} />}
                {modalContent === 'comingSoon' && <ComingSoonModal onClose={closeModal} />}
            </Modal>
        </div>
    );
}


