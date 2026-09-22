

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          username,
          mobileNumber,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstError = Object.values(
            data.errors,
          )[0];

          if (
            Array.isArray(firstError) &&
            firstError.length > 0
          ) {
            setError(String(firstError[0]));
          } else {
            setError(
              data.message ||
                "Registration failed. Please check your details.",
            );
          }
        } else {
          setError(
            data.message ||
              "Registration failed. Please try again.",
          );
        }

        return;
      }

      setSuccess(
        "Registration successful. You can now login.",
      );

      setName("");
      setEmail("");
      setUsername("");
      setMobileNumber("");
      setPassword("");
      setConfirmPassword("");
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
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            ArogyaCare Diagnostics
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Create your account
          </p>
        </div>

        <Card>
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)]">
                Registration
              </h2>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Enter your details to create your account.
              </p>
            </div>

            {error && (
              <div className="mb-5">
                <Alert variant="danger">
                  {error}
                </Alert>
              </div>
            )}

            {success && (
              <div className="mb-5">
                <Alert variant="success">
                  {success}
                </Alert>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <FormField
                label="Full Name"
                required
              >
                <Input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                  required
                />
              </FormField>

              <FormField
                label="Email Address"
                required
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email address"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </FormField>

              <FormField label="Username">
                <Input
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="Enter username (optional)"
                  autoComplete="username"
                  disabled={loading}
                />

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  3–30 characters. Letters, numbers and
                  underscore only.
                </p>
              </FormField>

              <FormField label="Mobile Number">
                <Input
                  type="tel"
                  value={mobileNumber}
                  onChange={(event) =>
                    setMobileNumber(event.target.value)
                  }
                  placeholder="Enter 10 digit mobile number"
                  autoComplete="tel"
                  maxLength={10}
                  inputMode="numeric"
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Password"
                required
              >
                <div className="relative">
                  <Input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous,
                      )
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
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                  Password must contain at least 8
                  characters, one uppercase letter, one
                  lowercase letter, one number and one
                  special character.
                </p>
              </FormField>

              <FormField
                label="Confirm Password"
                required
              >
                <div className="relative">
                  <Input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous,
                      )
                    }
                    disabled={loading}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>
              </FormField>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 border-t border-[var(--color-border)] pt-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
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
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
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
        d="M6.61 6.61C4.98 7.72 3.8 9.31 3.5 12c.42 1.74 1.3 3.15 2.55 4.39C7.72 17.98 9.31 19.16 12 19.5c1.74-.42 3.15-3.15 4.39-2.55"
      />
    </svg>
  );
}

