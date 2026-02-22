# Proteus Web Interface

The frontend for the **Proteus** automated molecular dynamics pipeline. Built with Next.js 14 (App Router) and React Three Fiber for immersive 3D visualization.

## Features

- **3D Hero Visualization**: A triple-nested, refractive tesseract hypercube built with `three.js` and `@react-three/drei`. Features high-quality glass transmission (`MeshTransmissionMaterial`) and glowing HDR outlines.
- **Simulation Dashboard**: Interfaces with the FastAPI backend to start simulations and view real-time results.
- **Modern UI**: Styled with Tailwind CSS for a clean, dark-mode aesthetic (`Black & Glowy`).

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **3D Graphics**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Drei](https://github.com/pmndrs/drei)
- **Post-Processing**: [React Three Postprocessing](https://github.com/pmndrs/react-postprocessing) (Bloom, Depth of Field)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000).