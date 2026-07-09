import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqKeys } from "@/lib/faq";
import { useI18n } from "@/i18n/provider";

export function FaqSection() {
  const { messages } = useI18n();
  const f = messages.faq;

  return (
    <section id="faq" className="scroll-mt-28 bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--logo-red)]">
            {f.eyebrow}
          </p>
          <h2 className="font-display text-3xl font-bold uppercase leading-[1.05] text-[var(--logo-black)] md:text-4xl">
            {f.titleLine1}
            <br />
            <span className="text-[var(--logo-red)]">{f.titleLine2}</span>
          </h2>
        </div>

        <Accordion
          type="single"
          collapsible
          className="rounded-lg border border-black/[0.08] bg-[#f7f7f7] px-5 md:px-6"
        >
          {faqKeys.map((key) => {
            const item = f.items[key];
            return (
              <AccordionItem key={key} value={key} className="border-black/[0.08]">
                <AccordionTrigger className="py-5 text-left font-display text-base font-bold uppercase tracking-[0.02em] text-[var(--logo-black)] hover:no-underline md:text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-black/65 md:text-[0.9375rem]">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}
