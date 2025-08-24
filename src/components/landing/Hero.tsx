import React from "react";
import Link from "next/link";

export default function Hero() {
  return (
    <header className="h-[80vh] grid place-items-center text-center">
      <div className="max-w-3xl px-4">
        <h2 className="text-[15px] rounded-full border border-green-600 bg-green-50 shadow-sm w-fit mx-auto text-green-700 px-4 py-1.5">
          For coaches that care about their time and clients
        </h2>

        <h1 className="text-4xl md:text-6xl my-4 md:my-8">
          <span className="text-grey block">Client tracking software </span>that
          actually keeps track
        </h1>

        <p className="md:text-xl">
          When client details are buried in spreadsheets, mistakes are
          inevitable. Clientmap is purpose-built to give coaches a clear, simple
          way to track clients, check-ins, and renewals — protecting your time
          and improving retention.
        </p>

        <div className="mt-12">
          <Link
            href="/register"
            className="rounded-md md:text-lg text-white bg-black px-4 py-2 f-hm mx-auto block w-fit"
          >
            Start Free Today
          </Link>

          <span className="text-sm mt-3 block opacity-40">
            No payment required
          </span>
        </div>
      </div>
    </header>
  );
}
