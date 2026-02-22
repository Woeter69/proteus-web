"use client";

import { useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Edges, Line, Stars, Sparkles, Environment } from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";

function ManualStars() {
  const stars = new Array(100).fill(0).map(() => ({
    pos: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    ] as [number, number, number],
    scale: Math.random() * 0.05 + 0.02
  }));

  return (
    <group>
      {stars.map((s, i) => (
        <mesh key={i} position={s.pos}>
          <sphereGeometry args={[s.scale, 8, 8]} />
          <meshBasicMaterial color="white" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function DecorationCube() {
  const size = 1.5;
  const halfSize = size / 2;
  const trapOffset = 0.08;

  const trapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-halfSize, halfSize);
    s.lineTo(halfSize, halfSize);
    s.lineTo(halfSize * 0.7, halfSize - trapOffset);
    s.lineTo(-halfSize * 0.7, halfSize - trapOffset);
    s.closePath();
    return s;
  }, [halfSize, trapOffset]);

  const bladeShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, halfSize);
    s.lineTo(0.02, 0);
    s.lineTo(0, -halfSize);
    s.lineTo(-0.02, 0);
    s.closePath();
    return s;
  }, [halfSize]);

  return (
    <group rotation={[0.5, 0.5, 0]}>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshPhysicalMaterial 
          color="#000000"
          transmission={0}
          roughness={0}
          metalness={0}
          ior={1.5}
          iridescence={1}
          iridescenceIOR={1.8}
          iridescenceThicknessRange={[100, 400]}
          envMapIntensity={2}
          clearcoat={1}
        />
        <Edges color="#ffffff" threshold={15} scale={1} />
      </mesh>
      
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const rot: [number, number, number] = [0, 0, 0];
        if (i === 4) rot[0] = Math.PI / 2;
        else if (i === 5) rot[0] = -Math.PI / 2;
        else rot[1] = (i * Math.PI) / 2;

        return (
          <group key={`face-${i}`} rotation={rot}>
            <group position={[0, 0, halfSize * 1.01]}>
              <mesh>
                <planeGeometry args={[0.2, 0.2]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
              </mesh>

              {[0, 1].map((r) => (
                <group key={`face-blade-${r}`} rotation={[0, 0, r * Math.PI / 2]}>
                   <mesh>
                     <shapeGeometry args={[bladeShape]} />
                     <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
                   </mesh>
                   <Line
                     points={[[0, -halfSize, 0], [0, halfSize, 0]]}
                     color="#ffffff"
                     lineWidth={1}
                     transparent
                     opacity={0.8}
                   />
                </group>
              ))}
              
              {[0, 1, 2, 3].map((side) => (
                <group key={`trap-${side}`} rotation={[0, 0, (side * Math.PI) / 2]}>
                   <mesh>
                     <shapeGeometry args={[trapShape]} />
                     <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
                   </mesh>
                   <Line
                     points={[
                       [-halfSize, halfSize, 0],
                       [halfSize, halfSize, 0],
                       [halfSize * 0.7, halfSize - trapOffset, 0],
                       [-halfSize * 0.7, halfSize - trapOffset, 0],
                       [-halfSize, halfSize, 0],
                     ]}
                     color="#ffffff"
                     lineWidth={1}
                     transparent
                     opacity={0.8}
                   />
                </group>
              ))}
            </group>
          </group>
        );
      })}
    </group>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function RecentSimulations() {
  const [sims, setSims] = useState<any[]>([]);

  const fetchSims = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulations`);
      if (res.ok) {
        const data = await res.json();
        setSims(data);
      }
    } catch (e) {
      console.error("Failed to fetch simulations", e);
    }
  };

  useEffect(() => {
    fetchSims();
    const interval = setInterval(fetchSims, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mt-12">
      <h2 className="text-2xl font-bold mb-4 text-white">Recent Simulations</h2>
      <div className="grid gap-4">
        {sims.map((sim) => (
          <div key={sim.id} className="bg-zinc-900/50 border border-white/10 p-4 rounded-lg flex items-center justify-between hover:bg-zinc-800/50 transition-all">
            <div>
              <div className="font-bold text-lg text-white">{sim.name}</div>
              <div className="text-sm text-zinc-400 font-mono">{sim.smiles}</div>
              <div className="text-xs text-zinc-500 mt-1">ID: {sim.task_id}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                sim.status === 'COMPLETED' ? 'bg-green-900/50 text-green-200 border border-green-500/30' :
                sim.status === 'RUNNING' ? 'bg-blue-900/50 text-blue-200 border border-blue-500/30 animate-pulse' :
                sim.status === 'FAILED' ? 'bg-red-900/50 text-red-200 border border-red-500/30' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {sim.status}
              </span>
              {sim.status === 'COMPLETED' && (
                <Link href={`/simulation/${sim.id}`} className="text-xs text-blue-400 hover:text-blue-300 underline">
                  View Results
                </Link>
              )}
            </div>
          </div>
        ))}
        {sims.length === 0 && (
          <div className="text-zinc-500 text-center py-8">No simulations found. Start one above!</div>
        )}
      </div>
    </div>
  );
}

export default function SimulationPage() {
  const [smiles, setSmiles] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [payload, setPayload] = useState("");
  const [payloadCount, setPayloadCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setTaskId(null);
    
    try {
      const response = await fetch(`${API_BASE}/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          smiles,
          name: name || `sim_${Date.now()}`, 
          email: email || null,
          payload: payload || null,
          payload_count: payload ? payloadCount : 0,
          render: true 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start simulation");
      }

      const data = await response.json();
      setTaskId(data.task_id);
      // Clear form on success
      setSmiles("");
      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-8 md:p-24 relative overflow-hidden bg-black text-white">
      {/* Full-screen 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas 
          dpr={[1, 2]}
          camera={{ position: [0, 0, 8], fov: 40 }}
        >
          <Stars radius={300} depth={60} count={20000} factor={8} saturation={0} fade speed={1} />
          <Sparkles scale={100} count={1000} size={2} speed={0.2} opacity={0.15} color="#ffffff" />
          <Sparkles scale={50} count={500} size={1} speed={0.1} opacity={0.3} color="#ffffff" />
          
          <Environment resolution={1024}>
            <group rotation={[-Math.PI / 4, 0, 0]}>
              <mesh scale={200}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshBasicMaterial color="#000000" side={THREE.BackSide} />
              </mesh>
            </group>
          </Environment>
        </Canvas>
      </div>

      {/* Header */}
      <div className="w-full max-w-4xl mb-12 flex justify-between items-center z-10">
        <Link href="/" className="text-2xl font-bold tracking-tighter glow-text hover:opacity-80 transition-opacity">
          PROTEUS
        </Link>
        <div className="h-12 w-12">
           <Canvas camera={{ position: [0, 0, 4] }}>
              <ambientLight intensity={0.5} />
              <Environment resolution={1024}>
                 <ManualStars />
                 <color attach="background" args={["#000000"]} />
              </Environment>
              <DecorationCube />
           </Canvas>
        </div>
      </div>

      {/* Form Container */}
      <main className="w-full max-w-xl z-10 mb-12">
        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
          <h1 className="text-3xl font-bold mb-2">New Simulation</h1>
          <p className="text-zinc-400 mb-8">Enter a generic SMILES string to generate a polymer topology.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                Simulation Name (Optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., PEO_Oligomer"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email Notification (Optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="notify@example.com"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="smiles" className="block text-sm font-medium text-zinc-300">
                SMILES String
              </label>
              <input
                id="smiles"
                type="text"
                value={smiles}
                onChange={(e) => setSmiles(e.target.value)}
                placeholder="e.g., C=CC"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="payload" className="block text-sm font-medium text-zinc-300">
                  Payload SMILES (Optional)
                </label>
                <input
                  id="payload"
                  type="text"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="e.g., CC(C)C1=C(C=C(C=C1)C(C)C(=O)O)C"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="payloadCount" className="block text-sm font-medium text-zinc-300">
                  Count
                </label>
                <input
                  id="payloadCount"
                  type="number"
                  min="1"
                  value={payloadCount}
                  onChange={(e) => setPayloadCount(parseInt(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-box"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Initialize Simulation"
                )}
              </button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                Error: {error}
              </div>
            )}

            {taskId && (
              <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg text-green-200 text-sm animate-pulse">
                Simulation Started! Check the list below for updates.
              </div>
            )}

            <div className="text-center">
               <p className="text-xs text-zinc-500 mt-4">
                 Standard simulation runs on CPU. GPU acceleration enabled if available.
               </p>
            </div>
          </form>
        </div>
      </main>

      {/* Recent Simulations List */}
      <RecentSimulations />
    </div>
  );
}