import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { IoLogoGithub, IoLogoInstagram, IoLogoLinkedin } from "react-icons/io5";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Create Room", to: "/create" },
  { label: "Login", to: "/login" },
  { label: "Register", to: "/register" },
];

const legalLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms" },
];

const socialLinks = [
  { icon: IoLogoGithub, href: "https://github.com/feastyr69", label: "GitHub" },
  { icon: IoLogoLinkedin, href: "https://linkedin.com/in/yashraj2006", label: "LinkedIn" },
  { icon: IoLogoInstagram, href: "https://instagram.com/feastyr", label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="w-full px-4 sm:px-6 lg:px-8 pb-8 md:pb-10">
      <motion.div
        className="max-w-6xl mx-auto rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl shadow-[0_12px_44px_rgba(0,0,0,0.35)] p-6 md:p-8"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-7 md:gap-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="font-display font-semibold text-xl md:text-2xl tracking-tight text-zinc-100">
                aura<span className="text-aura-400">.</span>
              </p>
              <p className="text-sm text-zinc-400 mt-2 max-w-md">
                Spotify sucks
              </p>
            </div>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/4 text-zinc-300 hover:text-aura-300 hover:border-aura-400/45 transition-colors"
                  aria-label={label}
                >
                  <Icon className="size-4.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-white/8" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-xs md:text-sm text-zinc-500">
              Crafted by <a href="https://github.com/feastyr69" target="_blank" rel="noreferrer" className="text-aura-400 hover:text-aura-300 transition-colors">Feastyr</a>
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              {legalLinks.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-xs md:text-sm text-zinc-500 hover:text-aura-400 transition-colors"
                >
                  {label}
                </Link>
              ))}
              <p className="text-xs md:text-sm text-zinc-500">© 2026 aura. All rights reserved.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
