import React from "react";
import Link from "next/link";

export default function Hero() {
  return (
    <header className="h-[80vh] grid place-items-center text-center">
      <div className="max-w-3xl px-4">
        <h2>For coaches that care about their time and clients</h2>

        <h1>
          Client tracking software <span>that actually keeps track</span>
        </h1>

        <p>
          When client details are buried in spreadsheets, mistakes are
          inevitable. Clientmap is purpose-built to give coaches a clear, simple
          way to track clients, check-ins, and renewals — protecting your time
          and improving retention.
        </p>

        <div>
          <Link href="/register" className="/register">
            Start Free Today
          </Link>

          <span>No payment required</span>
        </div>
      </div>
    </header>
  );
}
