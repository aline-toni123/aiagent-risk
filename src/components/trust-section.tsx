"use client";
import { motion } from "motion/react";
import { Shield, Award, Lock, CheckCircle } from "lucide-react";

export default function TrustSection() {
  const trustBadges = [
    { icon: Shield, label: "SOC 2 Certified" },
    { icon: Lock, label: "GDPR Compliant" },
    { icon: Award, label: "ISO 27001" },
    { icon: CheckCircle, label: "PCI DSS Level 1" }
  ];

  return (
    <section className="py-16 border-y bg-muted/20">
      <div className="container mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Enterprise-Grade Security & Compliance
          </h3>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <badge.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-sm">{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}