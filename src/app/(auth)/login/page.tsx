

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
  const [showPassword, setShowPassword] = useState(false);

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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.58 10.58a2 2 0 102.83 2.83"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 8.5 4 9.5 8a11.6 11.6 0 01-3.02 4.94"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.61 6.61C4.98 7.72 3.8 9.31 3.5 12c.42 1.74 1.3 3.15 2.55 4.39C7.72 17.98 9.31 19.16 12 19.5c1.74-.42 3.15-1.3 4.39-2.55"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12 18 19.5 12 19.5 2.25 12 2.25 12z"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
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

