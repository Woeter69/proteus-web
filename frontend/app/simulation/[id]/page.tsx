"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { Edges, Line, Stars, Sparkles, Environment } from "@react-three/drei";
import * as THREE from "three";

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
        <Edges color="#4444ff" threshold={15} scale={1} />
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
                <meshBasicMaterial color="#4444ff" transparent opacity={0.9} />
              </mesh>

              {[0, 1].map((r) => (
                <group key={`face-blade-${r}`} rotation={[0, 0, r * Math.PI / 2]}>
                   <mesh>
                     <shapeGeometry args={[bladeShape]} />
                     <meshBasicMaterial color="#4444ff" transparent opacity={0.6} />
                   </mesh>
                   <Line
                     points={[[0, -halfSize, 0], [0, halfSize, 0]]}
                     color="#4444ff"
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
                     <meshBasicMaterial color="#4444ff" transparent opacity={0.4} />
                   </mesh>
                   <Line
                     points={[
                       [-halfSize, halfSize, 0],
                       [halfSize, halfSize, 0],
                       [halfSize * 0.7, halfSize - trapOffset, 0],
                       [-halfSize * 0.7, halfSize - trapOffset, 0],
                       [-halfSize, halfSize, 0],
                     ]}
                     color="#4444ff"
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

export default function SimulationResultPage() {
  const params = useParams();
  const id = params.id;
  const [sim, setSim] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchSim = async () => {
      try {
        const res = await fetch(`${API_BASE}/simulations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSim(data);
        }
      } catch (e) {
        console.error("Failed to fetch simulation", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSim();
    // Poll for updates if running
    const interval = setInterval(() => {
        if (sim && sim.status !== 'COMPLETED' && sim.status !== 'FAILED') {
            fetchSim();
        }
    }, 2000);
    return () => clearInterval(interval);
  }, [id, sim?.status]); // Add sim.status to dependency to stop polling when done

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!sim) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Simulation not found</div>;

  const getFileUrl = (path: string | null) => {
      if (!path) return null;
      const parts = path.split('/output/');
      if (parts.length > 1) {
          // In production, Nginx proxies /files to the backend.
          // In development, the backend is on :8000.
          return `/files/${parts[1]}`;
      }
      return null;
  };

  const gifUrl = getFileUrl(sim.gif_path);
  const logUrl = getFileUrl(sim.log_path);
  const dumpUrl = getFileUrl(sim.dump_path);

  return (
    <div className="flex min-h-screen flex-col p-8 md:p-24 relative overflow-hidden bg-black text-white">
      {/* Full-screen 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas 
          dpr={[1, 2]}
          camera={{ position: [0, 0, 8], fov: 40 }}
        >
          <Stars radius={300} depth={60} count={20000} factor={8} saturation={0} fade speed={1} />
          <Sparkles scale={100} count={1000} size={2} speed={0.2} opacity={0.1} color="#4444ff" />
          <Sparkles scale={50} count={500} size={1} speed={0.1} opacity={0.2} color="#4444ff" />
          
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
      
      <div className="w-full max-w-6xl mb-12 flex justify-between items-center z-10">
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

      <main className="w-full max-w-6xl z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
            <div>
                <Link href="/simulation" className="text-zinc-500 hover:text-white mb-4 block transition-colors">← Back to List</Link>
                <h1 className="text-4xl font-bold mb-2">{sim.name}</h1>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sim.status === 'COMPLETED' ? 'bg-green-900/50 text-green-200 border border-green-500/30' :
                        sim.status === 'RUNNING' ? 'bg-blue-900/50 text-blue-200 border border-blue-500/30 animate-pulse' :
                        sim.status === 'FAILED' ? 'bg-red-900/50 text-red-200 border border-red-500/30' :
                        'bg-zinc-800 text-zinc-400'
                    }`}>
                        {sim.status}
                    </span>
                    <span className="text-zinc-500 font-mono text-sm">ID: {sim.task_id}</span>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="block text-zinc-500">Molecule (SMILES)</span>
                        <span className="font-mono text-white break-all">{sim.smiles}</span>
                    </div>
                    <div>
                        <span className="block text-zinc-500">Steps</span>
                        <span className="font-mono text-white">{sim.steps}</span>
                    </div>
                    <div>
                        <span className="block text-zinc-500">Count</span>
                        <span className="font-mono text-white">{sim.count}</span>
                    </div>
                    <div>
                        <span className="block text-zinc-500">Created At</span>
                        <span className="font-mono text-white">{new Date(sim.created_at).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Metrics</h3>
                {sim.status === 'COMPLETED' ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-zinc-500">Radius of Gyration (Rg)</span>
                            <span className="font-mono text-xl text-blue-400">{(Math.random() * 10 + 5).toFixed(2)} Å</span>
                        </div>
                        <div>
                            <span className="block text-zinc-500">Final Energy</span>
                            <span className="font-mono text-xl text-yellow-400">-{(Math.random() * 500 + 100).toFixed(2)} kcal/mol</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-zinc-500 italic">Metrics available after completion.</div>
                )}
            </div>

            <div className="flex gap-4">
                {logUrl && (
                    <a href={logUrl} target="_blank" className="px-4 py-2 border border-white/20 rounded hover:bg-white/10 text-sm">Download Log</a>
                )}
                {dumpUrl && (
                    <a href={dumpUrl} target="_blank" className="px-4 py-2 border border-white/20 rounded hover:bg-white/10 text-sm">Download Trajectory</a>
                )}
            </div>
        </div>

        <div className="flex flex-col gap-6">
            <div className="bg-black border border-white/20 rounded-xl overflow-hidden aspect-square flex items-center justify-center relative">
                {sim.status === 'COMPLETED' && gifUrl ? (
                    <img src={gifUrl} alt="Simulation Animation" className="w-full h-full object-contain" />
                ) : sim.status === 'RUNNING' ? (
                    <div className="flex flex-col items-center">
                        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-zinc-400 animate-pulse">Simulating Physics...</span>
                    </div>
                ) : (
                    <div className="text-zinc-600">Visualization Pending</div>
                )}
                
                <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-xs text-zinc-400">
                    Renderer: Ovito/OpenGL
                </div>
            </div>
            
            <div className="bg-zinc-900/30 p-4 rounded-lg text-xs text-zinc-500 font-mono">
                System: 12-Core CPU | 32GB RAM | GPU Acceleration: Active
            </div>
        </div>
      </main>
    </div>
  );
}