"use client";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-12 md:p-16"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">Limited Time Offer</span>
            </div>
            
            <h2 className="text-white text-3xl md:text-5xl font-bold mb-4">
              Start Assessing Credit Risk with AI Today
            </h2>
            <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Join 500+ financial institutions using SmartRisk AI to reduce defaults, 
              accelerate approvals, and make data-driven lending decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild
                size="lg" 
                variant="secondary"
                className="text-base px-8 group"
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild
                size="lg" 
                variant="outline"
                className="text-base px-8 bg-transparent text-white border-white hover:bg-white/10"
              >
                <Link href="/dashboard">
                  Try Live Demo
                </Link>
              </Button>
            </div>
            
            <p className="text-white/70 text-sm mt-6">
              No credit card required • 50 free assessments • Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}