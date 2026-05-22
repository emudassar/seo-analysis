/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { homefooterLinks } from "../../assets/assets";

export default function Footer() {
    return (
        <footer className="border-t border-border py-12 bg-card text-foreground">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-10">
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <Sparkles className="text-primary size-5" />
                            <span className="text-xl font-medium">SEO Pilot</span>
                        </Link>
                        <p className="text-sm text-muted-foreground w-5/6">AI-powered SEO audits for any website. Analyze, fix, and improve — all in one tool.</p>
                    </div>
                    {homefooterLinks.map((section: any) => (
                        <div key={section.title}>
                            <h3 className="text-sm font-medium mb-3">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((link: any) => (
                                    <li key={link}>
                                        <a href={`#${link.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="pt-8 border-t border-border text-sm text-muted-foreground">
                    © {new Date().getFullYear()} SEO Pilot. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
