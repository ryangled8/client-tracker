import React from "react";

const faqsData = [
  {
    question: "What is Clientmap?",
    answer:
      "Clientmap is a comprehensive client management tool designed to help businesses streamline their client interactions and improve overall efficiency.",
  },
  {
    question: "How does Clientmap help with client management?",
    answer:
      "Clientmap provides features such as contact management, task tracking, and communication logs to help businesses manage their client relationships effectively.",
  },
  {
    question: "Is Clientmap suitable for small businesses?",
    answer:
      "Yes, Clientmap is designed to be scalable and can be used by businesses of all sizes, including small businesses.",
  },
  {
    question: "Can I integrate Clientmap with other tools?",
    answer:
      "Yes, Clientmap offers integrations with various third-party applications to enhance its functionality.",
  },
];

export default function FAQs() {
  return (
    <section className="my-48">
      <div>
        <span>Tag</span>

        <h2>
          Frequently
          <span>Asked Questions</span>
        </h2>
      </div>

      {/* FQS Accordion */}
      <div>
        {faqsData.map((faq, index) => (
          <div key={index}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
