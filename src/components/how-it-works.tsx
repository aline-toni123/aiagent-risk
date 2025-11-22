"use client";
import { MoveUpRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

const HowItWorks = () => {
  return (
    <section className="" id="how-it-works">
      <div className="mx-auto max-w-7xl px-0 sm:px-8">
        <div className="container max-w-6xl px-4">
          <div className="mx-auto flex  max-w-4xl flex-col  gap-6 ">
            <div className="mb-2 max-w-4xl">
              <motion.h2
                initial={{ opacity: 0, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-foreground text-balance text-3xl font-semibold md:text-5xl"
              >
                <span className="text-muted-foreground">
                  AI-Powered Credit Risk Assessment for
                </span>{" "}
                SMEs & Individuals
              </motion.h2>
            </div>
            <p className="text-muted-foreground max-w-[30rem] text-balance text-left text-base leading-snug tracking-wide sm:text-lg">
              Evaluate creditworthiness, generate risk reports, and visualize
              risk patterns with SmartRisk AI's intelligent scoring platform.
            </p>
          </div>
        </div>
        <div className="relative mt-16 aspect-[1.2/1] overflow-hidden sm:-right-[10%] sm:right-auto sm:mt-16 sm:aspect-[2.788990826/1]">
          <div
            aria-hidden
            className="bg-linear-to-b to-background absolute inset-0 z-40 from-transparent from-35% "
          />
          <div className="absolute left-[8%] top-[11%] z-10 aspect-[0.7/1] w-[80%] sm:left-[4%] sm:w-[45%]">
            <div className="size-full [transform:rotateY(-30deg)_rotateX(-18deg)_rotate(-4deg)]">
              <img
                src="/risk-dashboard.png"
                alt="Risk assessment dashboard"
                className="block size-full object-cover object-left"
              />
            </div>
          </div>
          <div className="absolute left-[70%] top-0 z-20 aspect-[0.7/1] w-[73%] -translate-x-1/2 sm:left-1/2 sm:w-[38%]">
            <div className="size-full shadow-[-25px_0px_20px_0px_rgba(0,0,0,.04)] [transform:rotateY(-30deg)_rotateX(-18deg)_rotate(-4deg)]">
              <img
                src="/app-ui.png"
                alt=""
                className="block size-full object-cover  object-left"
              />
            </div>
          </div>
          <div className="absolute -right-[45%] top-[3%] z-30 aspect-[0.7/1] w-[85%] sm:-right-[2%] sm:w-[50%]">
            <div className="size-full shadow-[-25px_0px_20px_0px_rgba(0,0,0,.04)] [transform:rotateY(-30deg)_rotateX(-18deg)_rotate(-4deg)]">
              <img
                src="/credit-analytics.png"
                alt="Credit analytics screen"
                className="block size-full object-cover object-left"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { HowItWorks };