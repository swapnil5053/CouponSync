import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  UserIcon,
  KeyIcon,
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  CalendarIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsUpdatingProfile(true);
    const result = await updateUserProfile({
      name: profileForm.name,
      phone: profileForm.phone,
    });
    setIsUpdatingProfile(false);

    if (result.success) {
      toast.success("Your profile has been updated!");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.current_password) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error("Use at least 8 characters for your new password");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(passwordForm.new_password)) {
      toast.error(
        "Choose a password with an uppercase letter, a lowercase letter, and a number",
      );
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success(response.data.message || "Password changed successfully!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center">
          <UserIcon className="h-8 w-8 mr-3 text-emerald-600" />
          Account Settings
        </h1>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-slate-50/50 p-6 border-r border-slate-100 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "info"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <UserIcon className="h-5 w-5 mr-2.5" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "security"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <KeyIcon className="h-5 w-5 mr-2.5" />
              Password & Security
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "details"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <ShieldCheckIcon className="h-5 w-5 mr-2.5" />
              Account Details
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8">
            {activeTab === "info" && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-bold text-slate-850 mb-6">
                  Profile Details
                </h2>
                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ""}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl cursor-not-allowed text-sm focus:outline-none"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Email addresses cannot be changed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-200"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-200"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition duration-200 shadow-lg shadow-emerald-600/15 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isUpdatingProfile
                        ? "Saving Settings..."
                        : "Save Profile Settings"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "security" && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-bold text-slate-855 mb-6">
                  Change Account Password
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={passwordForm.current_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            current_password: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-200"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    For better security, use 8 or more characters with an
                    uppercase letter, a lowercase letter, and a number.
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={passwordForm.new_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            new_password: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-200"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={passwordForm.confirm_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm_password: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-200"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition duration-200 shadow-lg shadow-emerald-600/15 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword
                        ? "Updating Password..."
                        : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "details" && (
              <div className="animate-fadeIn space-y-6">
                <h2 className="text-xl font-bold text-slate-860 mb-4">
                  Account Information
                </h2>
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/20">
                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm font-medium text-slate-500 flex items-center">
                      <UserIcon className="h-4.5 w-4.5 mr-2 text-slate-450" />{" "}
                      Account Type
                    </span>
                    <span className="text-sm font-bold text-slate-900 capitalize px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                      {user?.role}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm font-medium text-slate-500 flex items-center">
                      <BriefcaseIcon className="h-4.5 w-4.5 mr-2 text-slate-450" />{" "}
                      Account Status
                    </span>
                    <span className="text-sm font-bold text-green-700 flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                      Active
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm font-medium text-slate-500 flex items-center">
                      <CalendarIcon className="h-4.5 w-4.5 mr-2 text-slate-450" />{" "}
                      Member Since
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "long", day: "numeric" },
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
