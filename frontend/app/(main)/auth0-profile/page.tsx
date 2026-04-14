"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Hello {user.name}</div>;
}