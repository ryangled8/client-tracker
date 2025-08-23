import Image from "next/image";
import Link from "next/link";
import React from "react";

// Card Data
const cardsData = [
  {
    imgUrl: "/test-jpg",
    imgAlt: "test alt",
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
    imgUrl: "/test-jpg",
    imgAlt: "test alt",
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
    imgUrl: "/test-jpg",
    imgAlt: "test alt",
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
  imgUrl: string;
  imgAlt: string;
}

const Card: React.FC<CardProps> = ({ title, description, imgUrl, imgAlt }) => {
  return (
    <div>
      <Image src={imgUrl} alt={imgAlt} width={100} height={100} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default function Benefits() {
  return (
    <section className="my-48">
      <div>
        <span>+ Benefits</span>

        <h2>
          Purpose Built <span>For Your Tracking Needs.</span>
        </h2>
      </div>

      <div>
        <p>
          You wouldn’t use broken equipment to train clients - so why use
          spreadsheets to manage them? No more broken formulas, messy tabs or
          endless lists - just one purpose built client management tool.
        </p>

        <Link href="/register" className="/register">
          Start Free Today
        </Link>
      </div>

      {/* Cards */}
      <div>
        {cardsData.map((card, index) => (
          <Card
            key={index}
            title={card.title}
            description={card.description}
            imgUrl={card.imgUrl}
            imgAlt={card.imgAlt}
          />
        ))}
      </div>
    </section>
  );
}
