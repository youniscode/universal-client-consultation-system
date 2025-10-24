// src/components/ui/LogoutButton.tsx
"use client";

import * as React from "react";

export default function LogoutButton() {
  async function onClick() {
    // call the server action via POST to a route handler
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login?loggedout=1";
  }

  return (
    <button className="btn btn-outline" onClick={onClick}>
      Logout
    </button>
  );
}
