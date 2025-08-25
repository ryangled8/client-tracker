import Image from "next/image";
import Link from "next/link";
import React from "react";
import { LandingPageTag } from "./LandingPageTag";

// Card Data
const cardsData = [
  {
    imgUrl: "/test-jpg",
    imgAlt: "test alt",
    title: "Stay organised and save time",
    description:
      "No more triple checking spreadsheets or digging through tabs.",
  },
  {
    imgUrl: "/test-jpg",
    imgAlt: "test alt",
    title: "Only track what you need",
    description: "Customise the data you want to track for your clients.",
  },
  {
    imgUrl: "/test-jpg",
    imgAlt: "test alt",
    title: "A solution that scales with you",
    description: "Manage 10 or 1,000 clients without your system breaking.",
  },
];

interface CardProps {
  title: string;
  description: string;
  imgUrl: string;
  imgAlt: string;
}

const Card: React.FC<CardProps> = ({ title, description, imgUrl, imgAlt }) => {
  return (
    <div className="w-[90%] md:w-[50%] flex-none snap-center lg:col-span-4 lg:w-full">
      <Image
        className="bg-white border w-full rounded-lg"
        src={imgUrl}
        alt={imgAlt}
        width={100}
        height={100}
      />

      <h3 className="text-2xl mt-4 mb-0.5">{title}</h3>
      <p className="text-black/80">{description}</p>
    </div>
  );
};

export default function Benefits() {
  return (
    <section className="bg-white">
      <div className="py-10 lg:py-24 grid gap-4 grid-cols-1 lg:grid-cols-12">
        <div className="mx-4 col-span-12 lg:grid grid-cols-12 gap-4 mb-5 md:mb-10">
          <div className="lg:col-span-5 xl:col-span-4">
            <LandingPageTag label="Benefits" />

            <h2 className="text-3xl md:text-4xl mt-5 mb-5 md:mb-10">
              <span className="text-grey block">Purpose Built.</span> For Your
              Tracking Needs.
            </h2>
          </div>

          <div className="col-span-4 col-start-9 lg:mt-12 max-w-md xl:max-w-none">
            <p>
              You wouldn’t use broken equipment to train clients - so why use
              spreadsheets to manage them? No more broken formulas, messy tabs
              or endless lists.
            </p>

            <Link
              href="/register"
              className="rounded-full text-white bg-black px-4 py-2 f-hm block w-fit mt-5"
            >
              Start Free Today
            </Link>
          </div>
        </div>

        {/* Cards */}
        <div className="px-4 col-span-12 flex gap-4 overflow-x-scroll snap-mandatory snap-x lg:grid lg:grid-cols-12 lg:gap-4">
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
      </div>
    </section>
  );
}
