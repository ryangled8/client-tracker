import React from "react";
import Link from "next/link";

const pricingCardsData = [
  {
    title: "Starter",
    price: {
      monthly: "$9",
      annually: "$90",
    },
    features: [
      "Feature One",
      "Feature Two",
      "Feature Three",
      "Feature Four",
      "Feature Five",
    ],
  },
  {
    title: "Basic",
    price: {
      monthly: "$9",
      annually: "$90",
    },
    features: [
      "Feature One",
      "Feature Two",
      "Feature Three",
      "Feature Four",
      "Feature Five",
    ],
  },
  {
    title: "Pro",
    price: {
      monthly: "$9",
      annually: "$90",
    },
    features: [
      "Feature One",
      "Feature Two",
      "Feature Three",
      "Feature Four",
      "Feature Five",
    ],
  },
  {
    title: "Team",
    price: {
      monthly: "$9",
      annually: "$90",
    },
    features: [
      "Feature One",
      "Feature Two",
      "Feature Three",
      "Feature Four",
      "Feature Five",
    ],
  },
];

export default function Pricing() {
  return (
    <section className="my-48">
      <div>
        <span>Tag</span>

        <h2>
          Pricing
          <span>A Plan For All</span>
        </h2>

        <div>
          <p>Available Bolt Ons</p>

          <div>
            <span>Bolt-on</span>
            <span>Bolt-on</span>
            <span>Bolt-on</span>
            <span>Bolt-on</span>
            <span>Bolt-on</span>
            <span>Bolt-on</span>
          </div>

          <Link href="/bolt-ons">Learn more about Bolt Ons</Link>
        </div>
      </div>

      <div>
        <div>
          <button>Bill Monthly</button>

          <div>
            <button>Bill Annually</button>
            <div>Save 20%</div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div>
          {pricingCardsData.map((card, index) => (
            <div key={index}>
              <h3>{card.title}</h3>

              <div>
                <span>{card.price.monthly}</span>
                <span>{card.price.annually}</span>
              </div>

              <ul>
                {card.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>{feature}</li>
                ))}
              </ul>

              <Link href="/register">Get Started</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
