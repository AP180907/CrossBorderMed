# CrossBorderMed
  AI-Powered Medicine Legality Verifier for Global Travelers

[[Live Demo (https://cross-border-med-8xr1.vercel.app/)
[[Watch Demo (https://drive.google.com/file/d/1J8cX0nmj5nHIp_8-MQvosoRxI1e9epdL/view?usp=sharing ) 

# The Problem
  Every year, travelers face fines or arrest for carrying legal prescriptions across borders. Most tools only check the final destination, ignoring the hidden legal traps of transit layovers and citizenship-based re-entry rules.

# The Solution
CrossBorderMed evaluates the entire travel chain (Origin → Transit → Destination) and adapts rules based on the traveler's citizenship. 
  - Multi-Leg Route Intelligence: Flags risks at every checkpoint.
  - AI Prescription Scanner: Extracts medication names from uploaded photos.
  - Automated Document Vault: Generates formal PDF medical certificates with scannable QR codes for border officers.
  - Deterministic Accuracy: Powered by a curated, verified regulatory dataset (no AI hallucinations).

# Tech Stack
- Frontend: React 19, TanStack Router, Tailwind CSS v4, Framer Motion
- Backend: Node.js, Express, TypeScript, Zod
- Data: Custom parsed regulatory dataset (Excel), xAI Vision API (OCR)
- Deployment: Vercel (Frontend), Render/Railway (Backend)



# Prototype Limitations
- Emergency Pharmacy Finder:Uses mock location data for demo purposes. Live Google Places API integration is planned for V2.
- OCR: Optimized for typed prescriptions and medicine boxes. Handwritten text may require manual correction.

# Team YapTech
