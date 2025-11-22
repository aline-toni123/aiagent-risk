"use client";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  const faqs = [
    {
      question: "How accurate is SmartRisk AI's credit scoring?",
      answer: "SmartRisk AI achieves 95% accuracy in credit risk predictions using advanced machine learning models trained on millions of credit assessments. Our AI continuously learns and improves, incorporating multiple data sources including payment history, income patterns, business performance, and location-based risk factors."
    },
    {
      question: "What types of applicants can be assessed?",
      answer: "Our platform is designed to assess a wide range of applicants including SMEs (small and medium enterprises), farmers and agricultural businesses, individual consumers, gig economy workers, and startups. Each assessment is tailored to the specific risk profile and industry context."
    },
    {
      question: "How quickly can I get a risk assessment?",
      answer: "Risk assessments are generated in under 30 seconds. Once you input applicant data, our AI processes hundreds of risk factors simultaneously and provides a comprehensive risk score with detailed insights and recommendations instantly."
    },
    {
      question: "Can I integrate SmartRisk AI with my existing systems?",
      answer: "Yes! SmartRisk AI offers robust API access for seamless integration with your existing loan management systems, CRM platforms, and banking software. Our Professional and Enterprise plans include comprehensive API documentation and technical support."
    },
    {
      question: "What makes SmartRisk AI different from traditional credit scoring?",
      answer: "Unlike traditional scoring systems that rely solely on credit history, SmartRisk AI uses AI to analyze alternative data sources including business cash flow patterns, location-based economic indicators, industry trends, and behavioral patterns. This approach enables fair assessment of applicants with limited credit history."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We employ bank-level encryption (AES-256), comply with international data protection regulations (GDPR, CCPA), and conduct regular security audits. All data is stored in secure, redundant data centers with 99.9% uptime guarantee."
    },
    {
      question: "Can I customize risk models for my organization?",
      answer: "Yes! Professional and Enterprise plans allow you to customize risk models based on your specific lending criteria, risk appetite, and industry focus. Our team works with you to fine-tune models using your historical data and performance metrics."
    },
    {
      question: "What kind of support do you offer?",
      answer: "We provide comprehensive support including 24/7 email support for all plans, priority phone and chat support for Professional plans, and dedicated account managers for Enterprise clients. We also offer training sessions, documentation, and a knowledge base."
    },
    {
      question: "How does the AI fraud detection work?",
      answer: "Our AI analyzes patterns across thousands of data points to identify anomalies, inconsistencies, and suspicious behavior that may indicate fraudulent applications. The system flags high-risk applications for manual review while automatically approving low-risk ones."
    },
    {
      question: "Can I try SmartRisk AI before committing?",
      answer: "Yes! Start with our free Starter plan which includes 50 risk assessments per month and access to basic features. You can upgrade to Professional or Enterprise plans anytime as your needs grow."
    }
  ];

  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-foreground text-balance text-3xl font-semibold md:text-5xl mb-4"
          >
            <span className="text-muted-foreground">Frequently Asked</span> Questions
          </motion.h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about SmartRisk AI
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help!
          </p>
          <a 
            href="mailto:support@smartriskai.com" 
            className="text-primary font-medium hover:underline"
          >
            Contact our support team →
          </a>
        </motion.div>
      </div>
    </section>
  );
}