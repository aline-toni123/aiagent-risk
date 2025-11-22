"use client";
import { motion } from "motion/react";

const StatsSection = () => {
  return (
    <section className="pt-32">
      <div className="container max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-foreground text-balance max-w-xl  text-center mx-auto text-3xl font-semibold md:text-4xl"
        >
          <span className="text-muted-foreground">SmartRisk AI by the Numbers</span>{" "}
          Stats
        </motion.h2>
        <div className="grid gap-10 pt-9 md:grid-cols-3 lg:gap-0 lg:pt-20">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Credit risk assessment accuracy of
            </p>
            <p className="pt-4 text-5xl font-semibold lg:pt-10">95%</p>
            <p className="text-xl font-semibold text-muted-foreground">
              precision
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Risk evaluations processed monthly
            </p>
            <p className="pt-4 text-5xl font-semibold lg:pt-10">10K+</p>
            <p className="text-xl font-semibold text-muted-foreground">
              applications
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Risk score generation time under
            </p>
            <p className="pt-4 text-5xl font-semibold lg:pt-10">30</p>
            <p className="text-xl font-semibold text-muted-foreground">
              seconds
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export { StatsSection };