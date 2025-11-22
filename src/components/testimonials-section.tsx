"use client";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Star, Quote } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Head of Credit Risk, National Bank",
      company: "National Bank",
      rating: 5,
      text: "SmartRisk AI transformed our lending process. We reduced loan default rates by 40% and assessment time by 75%. The AI-powered insights are incredibly accurate.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
      name: "Michael Chen",
      role: "CFO, MicroFinance Inc",
      company: "MicroFinance Inc",
      rating: 5,
      text: "The platform's ability to assess SME and farmer creditworthiness is unmatched. We've approved 3x more qualified applicants while maintaining lower risk levels.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    {
      name: "Priya Patel",
      role: "Risk Manager, AgriLend",
      company: "AgriLend",
      rating: 5,
      text: "Real-time risk heatmaps and predictive analytics gave us the edge we needed. Our portfolio performance improved by 35% in just 6 months.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
    },
    {
      name: "David Martinez",
      role: "VP of Lending, CapitalFlow",
      company: "CapitalFlow",
      rating: 5,
      text: "The AI-driven fraud detection caught cases our previous system missed. We've prevented over $2M in potential losses this year alone.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
    },
    {
      name: "Emily Thompson",
      role: "Director, SmallBiz Finance",
      company: "SmallBiz Finance",
      rating: 5,
      text: "Outstanding platform! The agentic finance planner helps our clients understand their creditworthiness and improve their scores proactively.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
    },
    {
      name: "James Wilson",
      role: "Chief Risk Officer, SecureCredit",
      company: "SecureCredit",
      rating: 5,
      text: "Comprehensive, accurate, and lightning-fast. SmartRisk AI is now the cornerstone of our risk management strategy.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James"
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-foreground text-balance text-3xl font-semibold md:text-5xl mb-4"
          >
            <span className="text-muted-foreground">Trusted by</span> Financial Institutions Worldwide
          </motion.h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how SmartRisk AI is transforming credit risk assessment for banks, 
            microfinance institutions, and lending platforms.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                  </div>
                  <Quote className="h-8 w-8 text-muted-foreground/20" />
                </div>
                
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  "{testimonial.text}"
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}