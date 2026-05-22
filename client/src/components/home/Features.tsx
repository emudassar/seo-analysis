/* eslint-disable @typescript-eslint/no-explicit-any */
import { homeFeaturesData } from "../../assets/assets";

export default function Features() {
    return (
        <section id="features" className="relative md:min-h-screen flex flex-col justify-center items-center max-lg:py-24 scroll-mt-20">
            <div className="bg-dot-pattern absolute inset-0 -z-1 opacity-10"></div>
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center px-4">
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-foreground">
                        Everything in <span className="gradient-text">one audit</span>
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">Real browser rendering plus AI — not just a static HTML fetch.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                    {homeFeaturesData.map((f: any) => (
                        <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/20 transition-all group">
                            <div className="text-primary mb-4 group-hover:scale-105 transition-transform duration-300 inline-block">{f.icon}</div>
                            <h3 className="text-lg font-medium mb-2 text-foreground">{f.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
