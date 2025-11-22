import React from "react";

import { TextReveal } from "@/components/magicui/text-reveal";

const TextRevealSection = () => {
  return (
    <section className="dark bg-background my-0 ">
      <div className=" flex flex-col items-center justify-center">
        <TextReveal className="font-medium">
          SmartRisk AI is the comprehensive credit scoring platform designed to empower 
          financial institutions and lenders with AI-driven risk assessment for SMEs, 
          farmers, and individuals. Seamlessly integrate intelligent credit decisions.
        </TextReveal>
      </div>
    </section>
  );
};

export { TextRevealSection };