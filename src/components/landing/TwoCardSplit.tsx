import React from "react";
import { LandingPageTag } from "./LandingPageTag";

// Card Data
const cardsData = [
  {
    tag: "Team Collaboration",
    title: (
      <span>
        <span className="text-grey block">Invite your team.</span>
        <span className="text-grey block">Assign their clients.</span>
        Stay aligned.
      </span>
    ),
    description:
      "Clientmap isn’t just for solo coaches. Invite other coaches to your team, assign their clients, and keep everything organised in one platform.",
  },
  {
    tag: "Smart Automated Tracking",
    title: (
      <span>
        <span className="text-grey block">Every package.</span>
        <span className="text-grey block">Every date.</span>
        Auto tracked.
      </span>
    ),
    description:
      "Create training packages with set dates and renewals. Clientmap auto calculates every key date so you never have to track or update them manually again.",
  },
];

export default function TwoCardSplit() {
  return (
    <section className="my-24 mx-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {cardsData.map((card, index) => (
        <div
          key={index}
          className="aspect-square bg-white rounded-lg col-span-1 p-5 flex flex-col justify-between"
        >
          <LandingPageTag label={card.tag} />

          <div>
            <h3 className="text-3xl md:text-4xl mt-4 mb-4 leading-9 md:leading-11">
              {card.title}
            </h3>

            <p className="max-w-[80%] text-black/80">{card.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
