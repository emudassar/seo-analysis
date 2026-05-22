/* eslint-disable @typescript-eslint/no-explicit-any */
import { homeHowItWorksData } from "../../assets/assets";

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="relative max-w-5xl md:min-h-[70vh] mx-auto px-4 py-24 scroll-mt-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-foreground">
                    How it <span className="gradient-text">works</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">Three steps from URL to actionable SEO report.</p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="hidden md:block absolute top-[100px] left-[18%] right-[18%] h-px border-t border-dashed border-border pointer-events-none"></div>
                {homeHowItWorksData.map((step: any) => (
                    <div key={step.num} className="relative z-10">
                        <div className="bg-card border border-border rounded-2xl p-8 text-center h-full hover:border-primary/25 transition-all">
                            <div className="text-4xl font-bold text-primary/15 mb-3">{step.num}</div>
                            <div className="size-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary border border-primary/20 bg-muted/30">{step.icon}</div>
                            <h3 className="font-medium mb-2 text-foreground">{step.title}</h3>
                            <p className="text-sm text-muted-foreground">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
