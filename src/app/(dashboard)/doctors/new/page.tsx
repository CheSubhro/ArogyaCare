"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

interface DoctorForm {
  name: string;
  qualification: string;
  specialization: string;
  registrationNumber: string;
  mobileNumber: string;
  email: string;
  clinicName: string;
  hospitalName: string;
  address: string;
  city: string;
  referralType:
    | "INDIVIDUAL"
    | "HOSPITAL"
    | "CLINIC"
    | "OTHER";
}

const initialForm: DoctorForm = {
  name: "",
  qualification: "",
  specialization: "",
  registrationNumber: "",
  mobileNumber: "",
  email: "",
  clinicName: "",
  hospitalName: "",
  address: "",
  city: "",
  referralType: "INDIVIDUAL",
};

export default function NewDoctorPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<DoctorForm>(initialForm);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string[]>>({});

  const updateField = <
    K extends keyof DoctorForm,
  >(
    field: K,
    value: DoctorForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: [],
    }));
  };

  const getFieldError = (
    field: keyof DoctorForm,
  ) => {
    return fieldErrors[field]?.[0];
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch(
        "/api/doctors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(form),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }

        setError(
          data.message ||
            "Failed to add doctor",
        );

        return;
      }

      router.push(
        `/doctors/${data.doctor.id}`,
      );
    } catch {
      setError(
        "Something went wrong while adding doctor",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Add Doctor / Referral
        </h1>

        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Add a doctor, hospital, clinic or other
          referral source.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic Information */}
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Enter the basic details of the doctor
              or referral source.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              label="Name"
              required
              error={getFieldError("name")}
            >
              <Input
                type="text"
                placeholder="Enter doctor / referral name"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
                required
              />
            </FormField>

            <FormField
              label="Referral Type"
              required
              error={getFieldError(
                "referralType",
              )}
            >
              <Select
                value={form.referralType}
                onChange={(event) =>
                  updateField(
                    "referralType",
                    event.target.value as DoctorForm["referralType"],
                  )
                }
              >
                <option value="INDIVIDUAL">
                  Individual Doctor
                </option>

                <option value="HOSPITAL">
                  Hospital
                </option>

                <option value="CLINIC">
                  Clinic
                </option>

                <option value="OTHER">
                  Other
                </option>
              </Select>
            </FormField>

            <FormField
              label="Qualification"
              error={getFieldError(
                "qualification",
              )}
            >
              <Input
                type="text"
                placeholder="e.g. MBBS, MD"
                value={form.qualification}
                onChange={(event) =>
                  updateField(
                    "qualification",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label="Specialization"
              error={getFieldError(
                "specialization",
              )}
            >
              <Input
                type="text"
                placeholder="e.g. Cardiology"
                value={form.specialization}
                onChange={(event) =>
                  updateField(
                    "specialization",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label="Registration Number"
              error={getFieldError(
                "registrationNumber",
              )}
            >
              <Input
                type="text"
                placeholder="Enter registration number"
                value={
                  form.registrationNumber
                }
                onChange={(event) =>
                  updateField(
                    "registrationNumber",
                    event.target.value,
                  )
                }
              />
            </FormField>
          </div>
        </Card>

        {/* Contact Information */}
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Contact Information
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Add phone, email and organization
              details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              label="Mobile Number"
              error={getFieldError(
                "mobileNumber",
              )}
            >
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={form.mobileNumber}
                onChange={(event) =>
                  updateField(
                    "mobileNumber",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label="Email"
              error={getFieldError("email")}
            >
              <Input
                type="email"
                placeholder="doctor@example.com"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label="Clinic Name"
              error={getFieldError(
                "clinicName",
              )}
            >
              <Input
                type="text"
                placeholder="Enter clinic name"
                value={form.clinicName}
                onChange={(event) =>
                  updateField(
                    "clinicName",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label="Hospital Name"
              error={getFieldError(
                "hospitalName",
              )}
            >
              <Input
                type="text"
                placeholder="Enter hospital name"
                value={form.hospitalName}
                onChange={(event) =>
                  updateField(
                    "hospitalName",
                    event.target.value,
                  )
                }
              />
            </FormField>
          </div>
        </Card>

        {/* Address */}
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Address
            </h2>
          </div>

          <div className="space-y-5">
            <FormField
              label="Address"
              error={getFieldError("address")}
            >
              <Textarea
                rows={4}
                placeholder="Enter address"
                value={form.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label="City"
              error={getFieldError("city")}
            >
              <Input
                type="text"
                placeholder="Enter city"
                value={form.city}
                onChange={(event) =>
                  updateField(
                    "city",
                    event.target.value,
                  )
                }
              />
            </FormField>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              router.push("/doctors")
            }
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "Save Doctor / Referral"}
          </Button>
        </div>
      </form>
    </div>
  );
}