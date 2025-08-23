import React from "react";

// Card Data
const cardsData = [
  {
    title: (
      <span>
        Messy spreadsheets. <span>Missed opportunities.</span>
      </span>
    ),
    description: (
      <span>
        Managing 20, 50, 100, or 200 clients in a spreadsheet makes it{" "}
        <span>easy to miss check-ins, renewals</span>, and{" "}
        <span>key details.</span>
      </span>
    ),
  },
  {
    title: (
      <span>
        The cost of missing key dates?<span>Lost clients.</span>
      </span>
    ),
    description: (
      <span>
        A missed call or expired package costs more than revenue.{" "}
        <span>It costs trust, time</span> and <span>clients.</span>
      </span>
    ),
  },
  {
    title: (
      <span>
        Hours lost in admin = <span>Hours not coaching.</span>
      </span>
    ),
    description: (
      <span>
        Manual updates and double-checking details drain time you{" "}
        <span>should spend with clients or on your business.</span>
      </span>
    ),
  },
];

interface CardProps {
  title: React.ReactNode;
  description: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, description }) => {
  return (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default function TitleWithThreeCards() {
  return (
    <section className="my-48">
      <div>
        <span>+ The Reality</span>
        <h2>
          Lose track. <span>Lose clients.</span>
        </h2>

        <p>
          Scaling your client list shouldn’t feel like a burden. And it doesn’t
          have to.
        </p>
      </div>

      {/* Cards */}
      <div>
        {cardsData.map((card, index) => (
          <Card key={index} title={card.title} description={card.description} />
        ))}
      </div>
    </section>
  );
}
