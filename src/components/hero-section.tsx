import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <section>
          <div className="relative pt-24">
            <div className="absolute inset-0 -z-10 size-full bg-background"></div>
            <div className="mx-auto max-w-5xl px-6">
              <div className="sm:mx-auto lg:mr-auto lg:mt-0">
                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 max-w-2xl  text-5xl font-medium md:text-6xl lg:mt-16"
                >
                  AI-Driven Credit Risk Intelligence
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mt-8 max-w-2xl text-pretty text-gray-200 text-lg"
                >
                  Smart credit scoring and risk advisory platform for SMEs,
                  farmers, and individuals. Make data-driven lending decisions
                  with advanced AI analytics.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex items-center gap-2"
                >
                  <div
                    key={1}
                    className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base"
                    >
                      <Link href="#link">
                        <span className="text-nowrap">Try Risk Calculator</span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-10.5 rounded-xl px-5 text-base"
                  >
                    <Link href="#link">
                      <span className="text-nowrap">View Dashboard</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div
                  aria-hidden
                  className="bg-linear-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                />
                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-5xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                  <Image
                    className="bg-background aspect-15/8 relative  rounded-2xl "
                    src="/app-ui.png"
                    alt="SmartRisk AI dashboard interface"
                    width="2700"
                    height="1440"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        <section className="bg-background pb-16 pt-16 md:pb-32">
          <div className="group relative m-auto max-w-5xl px-6">
            <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
              <Link
                href="/"
                className="block text-sm duration-150 hover:opacity-75"
              >
                <span>
                  {" "}
                  Trusted by banks, microfinance, and lending institutions:
                </span>

                <ChevronRight className="ml-1 inline-block size-3" />
              </Link>
            </div>
            <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
              <div className="flex items-center justify-center">
                <span className="text-foreground/60 font-bold text-lg tracking-wider">
                  FINBANK
                </span>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-foreground/60 font-bold text-lg tracking-wider">
                  CREDITECH
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-foreground/60 font-bold text-lg tracking-wider">
                  AGRILEND
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-foreground/60 font-bold text-lg tracking-wider">
                  MICROCAP
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-foreground/60 font-bold text-lg tracking-wider">
                  BIZFUND
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-foreground/60 font-bold text-lg tracking-wider">
                  SECURELOAN
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-foreground/60 font-bold text-lg tracking-wider">
                  CAPITALFLOW
                </span>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-foreground/60 font-bold text-lg tracking-wider">
                  RISKAI
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}