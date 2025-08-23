import Link from "next/link";
import React from "react";

export default function CtaBanner() {
  return (
    <section className="my-48">
      <div>
        <span>Tag</span>

        <div>
          <h3>
            Make your tracking
            <span>As great as your coaching.</span>
          </h3>

          <p>
            Stay organised, keep every date in check. Never lose a client to
            chaos again.
          </p>
        </div>

        <Link href="/register" className="/register">
          Start Free Today
        </Link>
      </div>
    </section>
  );
}
