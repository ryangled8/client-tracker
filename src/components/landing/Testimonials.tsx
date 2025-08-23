import Image from "next/image";
import Link from "next/link";
import React from "react";

const testimonialData = [
  {
    image: {
      url: "/img.jpg",
      alt: "Image Alt Text",
    },
    name: "John Doe",
    company: "Head Coach",
    review:
      "The time I am saving is crazy. I wish I did this sooner for my coaches and clients.",
    flipped: false,
  },
  {
    image: {
      url: "/img.jpg",
      alt: "Image Alt Text",
    },
    name: "John Doe",
    company: "Head Coach",
    review:
      "Transferring over 120 clients to Clientmap was so quick and easy. They are all so organised and accurate!",
    flipped: true,
  },
];

export default function Testimonials() {
  return (
    <section className="my-24">
      <div>
        <h3>
          Words from <span>Our Coaches</span>
        </h3>

        <div>Tag</div>
      </div>

      {/* Cards */}
      <div>
        {/* Testimonial Cards */}
        <div>
          {testimonialData.map((testimonial, index) => (
            <div
              key={index}
              className={`${testimonial.flipped ? "flipped" : ""}`}
            >
              <div>
                <Image
                  src={testimonial.image.url}
                  alt={testimonial.image.alt}
                  width={100}
                  height={100}
                />

                <h4>{testimonial.name}</h4>

                <p>{testimonial.company}</p>
              </div>

              <div>
                <blockquote>{testimonial.review}</blockquote>
              </div>
            </div>
          ))}
        </div>

        {/* Summmary Card */}
        <div>
          {/* Card Header */}
          <div>
            <p>
              <span>Empowering</span> over 100 coaches to effortlessly manage,
              track and organise <span>2500+ clients.</span>
            </p>

            <p>100+</p>
          </div>

          {/* Card Footer */}
          <div>
            <div>
              <pre>Image thumbanails</pre>
              <div>
                <p>ClientMap</p>
                <p>Trusted by coaches worldwide.</p>
              </div>
            </div>

            <Link href="/register" className="/register">
              Try for yourself
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
