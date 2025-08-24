import React from "react";
import { LandingPageTag } from "./LandingPageTag";

// Card Data
const cardsData = [
  {
    title: (
      <span>
        <span className="text-grey xl:block -mb-1">Messy spreadsheets.</span>{" "}
        Missed opportunities.
      </span>
    ),
    description: (
      <span>
        Managing 20, 50, 100, or 200 clients in a spreadsheet makes it{" "}
        <span className="f-hm">easy to miss check-ins, renewals</span>, and{" "}
        <span className="f-hm">key details.</span>
      </span>
    ),
  },
  {
    title: (
      <span>
        <span className="text-grey">The cost of missing key dates?</span> Lost
        clients.
      </span>
    ),
    description: (
      <span>
        A missed call or expired package costs more than revenue.{" "}
        <span className="f-hm">It costs trust, time</span> and{" "}
        <span className="f-hm">clients.</span>
      </span>
    ),
  },
  {
    title: (
      <span>
        <span className="text-grey xl:block -mb-1">Hours lost in admin = </span>{" "}
        Hours not coaching.
      </span>
    ),
    description: (
      <span>
        Manual updates and double-checking details drain time you{" "}
        <span className="f-hm">
          should spend with clients or on your business.
        </span>
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
    <div className="rounded-lg bg-white p-7 xl:aspect-square flex flex-col justify-between xl:w-1/3">
      <h3 className="text-2xl mb-20 xl:mb-0">{title}</h3>
      <p className="text-black/60">{description}</p>
    </div>
  );
};

export default function TitleWithThreeCards() {
  return (
    <section className="my-10 lg:my-24 mx-4 grid gap-4 grid-cols-1 lg:grid-cols-12">
      <div className="col-span-4 mb-5 lg:mb-0">
        <LandingPageTag label="The Reality" />

        <h2 className="text-3xl md:text-4xl mt-5 mb-5 md:mb-10">
          <span className="text-grey block">Lost track.</span> Lose clients.
        </h2>

        <p className="text-black/60">
          Scaling your client list shouldn’t feel like a burden.{" "}
          <span className="block f-hm">And it doesn’t have to.</span>
        </p>
      </div>

      {/* Cards */}
      <div className="col-span-8 flex flex-col xl:flex-row gap-4">
        {cardsData.map((card, index) => (
          <Card key={index} title={card.title} description={card.description} />
        ))}
      </div>
    </section>
  );
}
