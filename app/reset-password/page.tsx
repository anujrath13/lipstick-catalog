"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepareRecoverySession = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setErrorMessage("This password reset link is invalid or expired.");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setIsReady(true);
    };

    void prepareRecoverySession();
  }, []);

  const handleUpdatePassword = async () => {
    setMessage("");
    setErrorMessage("");

    if (!password.trim() || !confirmPassword.trim()) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Password updated successfully. You can now sign in.");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white px-4 py-6 md:p-8">
      <div className="mx-auto max-w-md">
        <Card className="overflow-hidden rounded-[28px] border border-rose-100 bg-white/95 shadow-lg shadow-rose-100/40">
          <div className="h-2 bg-gradient-to-r from-rose-200 via-pink-200 to-fuchsia-200" />
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight">Reset Password</CardTitle>
            <p className="text-sm text-slate-600">
              Enter your new password below.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage ? (
              <p className="text-sm text-rose-600">{errorMessage}</p>
            ) : null}

            {message ? (
              <p className="text-sm text-green-600">{message}</p>
            ) : null}

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="rounded-2xl border-rose-100"
                disabled={!isReady || isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="rounded-2xl border-rose-100"
                disabled={!isReady || isSaving}
              />
            </div>

            <Button
              onClick={() => void handleUpdatePassword()}
              disabled={!isReady || isSaving}
              className="w-full rounded-2xl"
            >
              {isSaving ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}