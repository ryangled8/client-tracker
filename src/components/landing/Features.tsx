import { Zap } from "lucide-react";
import React from "react";

const cardsData = [
  {
    icon: <Zap />,
    title: "Feature One",
    description:
      "Clients, teams, and training packages — all neatly organised and easy to manage.",
  },
  {
    icon: <Zap />,
    title: "Feature One",
    description:
      "Clients, teams, and training packages — all neatly organised and easy to manage.",
  },
  {
    icon: <Zap />,
    title: "Feature One",
    description:
      "Clients, teams, and training packages — all neatly organised and easy to manage.",
  },
  {
    icon: <Zap />,
    title: "Feature One",
    description:
      "Clients, teams, and training packages — all neatly organised and easy to manage.",
  },
];

export default function Features() {
  return (
    <section className="my-48">
      <div>
        <span>Tag</span>

        <h2>
          So, what’s inside?
          <span>Clientmap Features</span>
        </h2>
      </div>

      {/* Cards */}
      <div>
        {cardsData.map((card, index) => (
          <div key={index}>
            <div>{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
