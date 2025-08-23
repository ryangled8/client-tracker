import React from "react";

// Card Data
const cardsData = [
  {
    tag: "Team Collaboration",
    title: (
      <span>
        Invite your team. Assign their clients.
        <span>Stay aligned.</span>
      </span>
    ),
    description:
      "Clientmap isn’t just for solo coaches. Invite other coaches to your team, assign their clients, and keep everything organised in one platform.",
  },
  {
    tag: "Smart Automated Tracking",
    title: (
      <span>
        Every package. Every date.
        <span>Auto tracked.</span>
      </span>
    ),
    description:
      "Create training packages with set dates and renewals. Clientmap auto calculates every key date so you never have to track or update them manually again.",
  },
];

export default function TwoCardSplit() {
  return (
    <section className="my-48">
      <div>
        {cardsData.map((card, index) => (
          <div key={index}>
            <h3>{card.tag}</h3>
            <h4>{card.title}</h4>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
