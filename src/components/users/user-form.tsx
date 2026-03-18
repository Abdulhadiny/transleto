"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const roleOptions = [
  { value: "TRANSLATOR", label: "Translator" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "ADMIN", label: "Admin" },
];

export function UserForm({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Failed to create user");
      setLoading(false);
      return;
    }

    setSuccess("User created successfully");
    setLoading(false);
    (e.target as HTMLFormElement).reset();
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id="name" name="name" label="Name" required />
        <Input id="email" name="email" label="Email" type="email" required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id="password" name="password" label="Password" type="password" required minLength={6} />
        <Select id="role" name="role" label="Role" options={roleOptions} defaultValue="TRANSLATOR" />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
}
