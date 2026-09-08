"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, UserCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PasswordField } from "@/components/PasswordField";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/hooks/useNotifications";
import { api, apiForm, assetUrl } from "@/lib/api";
import { passwordError } from "@/lib/password";
import { formatDate } from "@/lib/utils";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const { notifications, setNotifications } = useNotifications(!!user);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (loading || !user) {
    return <div className="p-10 text-center animate-pulse-soft">Loading profile…</div>;
  }

  const avatarSrc = assetUrl(user.avatarUrl);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      await refresh();
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const pwErr = passwordError(newPassword);
    if (pwErr) {
      setError(pwErr);
      setBusy(false);
      return;
    }
    try {
      await api("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAvatarSelected(file?: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("avatar", file);
      await apiForm<{ user: User }>("/auth/avatar", form);
      await refresh();
      setMessage("Profile photo updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/auth/avatar", { method: "DELETE" });
      await refresh();
      setMessage("Profile photo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="My Profile"
      notifications={notifications}
      onNotificationsChange={setNotifications}
    >
      <div className="mb-4">
        <h1 className="display text-3xl font-bold">My Profile</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          Manage your photo, account details and password.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface space-y-4 p-5">
          <h2 className="text-lg font-semibold">Profile photo</h2>
          <div className="flex flex-wrap items-center gap-4">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt={user.name} className="avatar avatar-lg" />
            ) : (
              <span
                className="avatar avatar-lg inline-flex items-center justify-center"
                style={{ color: "var(--brand-strong)" }}
              >
                <UserCircle2 size={64} />
              </span>
            )}
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onAvatarSelected(e.target.files?.[0])}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                <Camera size={16} /> {avatarSrc ? "Change photo" : "Add photo"}
              </button>
              {avatarSrc && (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy}
                  onClick={() => void removeAvatar()}
                >
                  <Trash2 size={16} /> Remove photo
                </button>
              )}
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                JPG/PNG up to 2MB.
              </p>
            </div>
          </div>
        </div>

        <form className="surface space-y-4 p-5" onSubmit={saveProfile}>
          <h2 className="text-lg font-semibold">Account</h2>
          <div>
            <label className="label">Name</label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="field" value={user.email} disabled />
          </div>
          <div className="flex flex-wrap gap-3 text-sm" style={{ color: "var(--ink-muted)" }}>
            <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
              {user.role}
            </span>
            <span>Joined {formatDate(user.createdAt)}</span>
          </div>
          <button className="btn btn-primary" disabled={busy}>
            Save profile
          </button>
        </form>

        <form className="surface space-y-4 p-5 lg:col-span-2" onSubmit={savePassword}>
          <h2 className="text-lg font-semibold">Change password</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              name="currentPassword"
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              showRules
              name="newPassword"
            />
          </div>
          <button className="btn btn-primary" disabled={busy}>
            Update password
          </button>
        </form>
      </div>

      {message && (
        <p className="mt-4 text-sm" style={{ color: "var(--ok)" }}>
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </AppShell>
  );
}
