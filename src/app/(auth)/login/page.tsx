

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to login. Please try again.",
        );
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError(
        "Unable to connect to the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            ArogyaCare Diagnostics
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Sign in to your account
          </p>
        </div>

        <Card>
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)]">
                Login
              </h2>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Enter your account credentials to continue.
              </p>
            </div>

            {error && (
              <div className="mb-5">
                <Alert variant="danger">
                  {error}
                </Alert>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <FormField
                label="Email or Username"
                required
              >
                <Input
                  type="text"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(event.target.value)
                  }
                  placeholder="Enter email or username"
                  autoComplete="username"
                  disabled={loading}
                  required
                />
              </FormField>

              <FormField
                label="Password"
                required
              >
                <Input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
              </FormField>

              <div className="flex items-center justify-between gap-4">
                <Checkbox
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  disabled={loading}
                />

                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 border-t border-[var(--color-border)] pt-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

