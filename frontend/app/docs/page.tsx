"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "intro", title: "Introduction" },
  { id: "features", title: "Features" },
  { id: "variables", title: "Physics & Variables" },
  { id: "architecture", title: "Architecture" },
  { id: "principles", title: "UX Principles" },
  { id: "database", title: "Database Setup" },
  { id: "changelog", title: "Changelog" },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("intro");

  // Simple scroll spy to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
          setActiveSection(section.id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,40,0.5),rgba(0,0,0,1))] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row max-w-7xl mx-auto p-6 md:p-12 gap-12">
        {/* Sidebar Navigation */}
        <aside className="md:w-64 flex-shrink-0">
          <div className="sticky top-12">
            <Link href="/" className="block text-2xl font-bold tracking-tighter text-white mb-8 hover:opacity-80 transition-opacity glow-text">
              PROTEUS
            </Link>
            
            <nav className="space-y-2 border-l border-zinc-800 pl-4">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`block text-sm transition-colors ${
                    activeSection === section.id
                      ? "text-blue-400 font-bold border-l-2 border-blue-400 -ml-[18px] pl-4"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {section.title}
                </a>
              ))}
            </nav>
            
            <div className="mt-12 pt-8 border-t border-zinc-800">
               <div className="text-xs text-zinc-600 uppercase tracking-widest font-bold mb-2">Version</div>
               <div className="font-mono text-zinc-400">v1.2.0</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-24 pb-32">
          
          <section id="intro" className="space-y-6">
            <h1 className="text-5xl font-bold text-white tracking-tight">Documentation</h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Proteus is an automated computational pipeline designed to simulate the self-assembly and nanoprecipitation of polymer chains. 
              By bridging the gap between chemical text (SMILES) and physical simulation (Molecular Dynamics), it enables rapid screening of polymer behaviors.
            </p>
            <div className="p-6 bg-zinc-900/50 border border-blue-500/20 rounded-xl">
               <h3 className="text-blue-400 font-bold mb-2">Core Philosophy</h3>
               <p className="text-sm">
                 Proteus prioritizes <strong>Optionality</strong> and <strong>User Experience</strong>. Complex physics are automated, and advanced features (like drug payloads) are strictly opt-in.
               </p>
            </div>
          </section>

          <section id="features" className="space-y-8">
            <h2 className="text-3xl font-bold text-white border-b border-zinc-800 pb-4">Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
               <FeatureCard 
                 title="Text-to-Structure" 
                 desc="Instantly converts SMILES strings into 3D molecular geometries with explicit hydrogens using RDKit."
               />
               <FeatureCard 
                 title="Automated Topology" 
                 desc="Generates LAMMPS-compliant data files with generic force field parameters (Lennard-Jones/OPLS-AA)."
               />
               <FeatureCard 
                 title="Physics Engine" 
                 desc="Runs implicit solvent simulations using Langevin dynamics with optimized viscosity for realistic drifting."
               />
               <FeatureCard 
                 title="Analytics & Viz" 
                 desc="Calculates Radius of Gyration (Rg) and renders high-quality, color-coded GIF animations via Ovito."
               />
            </div>
          </section>

          <section id="variables" className="space-y-8">
            <h2 className="text-3xl font-bold text-white border-b border-zinc-800 pb-4">Physics & Variables</h2>
            <p className="text-zinc-400">
              The following parameters control the simulation physics. Use these flags in the CLI or Web Interface configuration.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-400">
                    <th className="py-2 pr-4">Variable</th>
                    <th className="py-2 pr-4">Default</th>
                    <th className="py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <VarRow name="--temp" default="300.0 K" desc="Controls thermal energy in the Langevin thermostat." />
                  <VarRow name="--damp" default="20.0 fs" desc="Inverse of viscosity. Lower value = Higher Friction (Thicker Solvent)." />
                  <VarRow name="--timestep" default="1.0 fs" desc="Resolution of the simulation integration." />
                  <VarRow name="--padding" default="20.0 Å" desc="Extra space around molecules to determine Simulation Box size." />
                  <VarRow name="--steps" default="10000" desc="Total number of simulation steps to run." />
                  <VarRow name="--epsilon" default="0.105" desc="Lennard-Jones Interaction Strength (Depth of potential well)." />
                  <VarRow name="--sigma" default="2.5 Å" desc="Lennard-Jones Particle Size." />
                </tbody>
              </table>
            </div>
          </section>

          <section id="architecture" className="space-y-8">
            <h2 className="text-3xl font-bold text-white border-b border-zinc-800 pb-4">Architecture</h2>
            <div className="space-y-4">
               <Step number="1" title="Topology Architect (topology.py)">
                 Converts SMILES input into a 3D structure. It handles multiple molecules, generates coordinates, and assigns atom types based on a generic hydrophobic interaction model.
               </Step>
               <Step number="2" title="Simulation Engine (simulation.py)">
                 Constructs the LAMMPS input script. It sets up the simulation box, defines the Langevin thermostat (implicit solvent), and runs the molecular dynamics integration.
               </Step>
               <Step number="3" title="Analysis Module (analysis.py)">
                 Parses the raw LAMMPS log files to extract thermodynamic data (Potential Energy, Kinetic Energy) and calculates structural metrics like the Radius of Gyration ($R_g$).
               </Step>
               <Step number="4" title="Visualization (visualization.py)">
                 Uses Ovito's headless rendering engine to produce high-quality trajectory animations. It supports GPU acceleration (OpenGL) with a CPU fallback.
               </Step>
            </div>
          </section>

          <section id="principles" className="space-y-6">
            <h2 className="text-3xl font-bold text-white border-b border-zinc-800 pb-4">UX Principles</h2>
            <div className="prose prose-invert max-w-none text-zinc-400">
              <p>
                Proteus is built on the belief that scientific software shouldn't be painful. 
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Optionality is Key:</strong> Specialized features (like "The Payload" drug encapsulation) are strictly optional. They are never enabled by default.</li>
                <li><strong>User Control:</strong> We never force complex simulation parameters on the user. Defaults are tuned for general polymer physics.</li>
                <li><strong>UX First:</strong> A clean interface and understandable output take precedence over feature bloat.</li>
              </ul>
            </div>
          </section>

          <section id="database" className="space-y-6">
            <h2 className="text-3xl font-bold text-white border-b border-zinc-800 pb-4">Database Setup</h2>
            <p className="text-zinc-400">
              Proteus supports both lightweight local development and robust production deployment.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                    <h3 className="text-lg font-bold text-white mb-2">SQLite (Default)</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                        Zero-configuration, file-based database. Perfect for local testing and small-scale runs.
                    </p>
                    <code className="bg-black px-2 py-1 rounded text-xs text-green-400 block">data/proteus.db</code>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                    <h3 className="text-lg font-bold text-white mb-2">PostgreSQL (Production)</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                        Scalable SQL database recommended for serious data collection and AI training sets.
                    </p>
                    <div className="text-xs space-y-2">
                        <code className="bg-black px-2 py-1 rounded text-blue-400 block">$ docker compose up -d</code>
                        <span className="block text-zinc-500">Requires DATABASE_URL in .env</span>
                    </div>
                </div>
            </div>
          </section>

          <section id="changelog" className="space-y-8">
            <h2 className="text-3xl font-bold text-white border-b border-zinc-800 pb-4">Latest Updates</h2>
            <div className="space-y-6">
               <ChangelogEntry version="1.2.0" date="2026-01-21">
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li>Added <strong className="text-white">Email Notifications</strong>: Users can now opt-in to receive alerts when simulations complete.</li>
                    <li>Added <strong className="text-white">PostgreSQL Support</strong>: Full support for production-grade databases via Docker Compose.</li>
                    <li>Added <strong className="text-white">Documentation</strong>: Comprehensive web-based documentation (this page).</li>
                    <li>Enhanced <strong className="text-white">Frontend</strong>: Improved result visualization page with real-time status updates.</li>
                  </ul>
               </ChangelogEntry>
               
               <ChangelogEntry version="1.1.0" date="2026-01-20">
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                     <li>Added <strong>CHONS Forcefield</strong> support (OPLS-AA).</li>
                     <li>Implemented <strong>"The Payload"</strong> (Drug Encapsulation) mechanics.</li>
                     <li>Exposed advanced physics controls (temp, damp, timestep) to CLI.</li>
                  </ul>
               </ChangelogEntry>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

// Components

function FeatureCard({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="bg-zinc-900/30 p-6 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
        </div>
    );
}

function VarRow({ name, default: def, desc }: { name: string, default: string, desc: string }) {
    return (
        <tr className="border-b border-zinc-800 hover:bg-white/5 transition-colors">
            <td className="py-4 pr-4 font-bold text-blue-400">{name}</td>
            <td className="py-4 pr-4 text-zinc-300">{def}</td>
            <td className="py-4 text-zinc-500">{desc}</td>
        </tr>
    );
}

function Step({ number, title, children }: { number: string, title: string, children: React.ReactNode }) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold font-mono text-sm">
                {number}
            </div>
            <div>
                <h4 className="text-white font-bold mb-1">{title}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">{children}</p>
            </div>
        </div>
    );
}

function ChangelogEntry({ version, date, children }: { version: string, date: string, children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-baseline gap-3 mb-2">
                <span className="text-xl font-bold text-white">v{version}</span>
                <span className="text-sm font-mono text-zinc-500">{date}</span>
            </div>
            <div className="text-sm">
                {children}
            </div>
        </div>
    );
}
